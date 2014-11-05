import Texture2DBase					= require("awayjs-core/lib/textures/Texture2DBase");

import ShaderObjectBase					= require("awayjs-renderergl/lib/compilation/ShaderObjectBase");
import ShaderRegisterCache				= require("awayjs-renderergl/lib/compilation/ShaderRegisterCache");
import ShaderRegisterData				= require("awayjs-renderergl/lib/compilation/ShaderRegisterData");
import ShaderRegisterElement			= require("awayjs-renderergl/lib/compilation/ShaderRegisterElement");
import ShaderCompilerHelper				= require("awayjs-renderergl/lib/utils/ShaderCompilerHelper");

import MethodVO							= require("awayjs-methodmaterials/lib/data/MethodVO");
import NormalBasicMethod				= require("awayjs-methodmaterials/lib/methods/NormalBasicMethod");
import ShadingMethodBase				= require("awayjs-methodmaterials/lib/methods/ShadingMethodBase");

/**
 * NormalHeightMapMethod provides a normal map method that uses a height map to calculate the normals.
 */
class NormalHeightMapMethod extends NormalBasicMethod
{
	private _worldXYRatio:number;
	private _worldXZRatio:number;

	/**
	 * Creates a new NormalHeightMapMethod method.
	 *
	 * @param heightMap The texture containing the height data. 0 means low, 1 means high.
	 * @param worldWidth The width of the 'world'. This is used to map uv coordinates' u component to scene dimensions.
	 * @param worldHeight The height of the 'world'. This is used to map the height map values to scene dimensions.
	 * @param worldDepth The depth of the 'world'. This is used to map uv coordinates' v component to scene dimensions.
	 */
	constructor(heightMap:Texture2DBase, worldWidth:number, worldHeight:number, worldDepth:number)
	{
		super();

		this.normalMap = heightMap;
		this._worldXYRatio = worldWidth/worldHeight;
		this._worldXZRatio = worldDepth/worldHeight;
	}

	/**
	 * @inheritDoc
	 */
	public iInitConstants(shaderObject:ShaderObjectBase, methodVO:MethodVO)
	{
		var index:number /*int*/ = methodVO.fragmentConstantsIndex;
		var data:Array<number> = shaderObject.fragmentConstantData;
		data[index] = 1/this.normalMap.width;
		data[index + 1] = 1/this.normalMap.height;
		data[index + 2] = 0;
		data[index + 3] = 1;
		data[index + 4] = this._worldXYRatio;
		data[index + 5] = this._worldXZRatio;
	}

	/**
	 * @inheritDoc
	 */
	public get tangentSpace():boolean
	{
		return false;
	}

	/**
	 * @inheritDoc
	 */
	public copyFrom(method:ShadingMethodBase)
	{
		super.copyFrom(method);

		this._worldXYRatio = (<NormalHeightMapMethod> method)._worldXYRatio;
		this._worldXZRatio = (<NormalHeightMapMethod> method)._worldXZRatio;
	}

	/**
	 * @inheritDoc
	 */
	public iGetFragmentCode(shaderObject:ShaderObjectBase, methodVO:MethodVO, targetReg:ShaderRegisterElement, registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		var temp:ShaderRegisterElement = registerCache.getFreeFragmentVectorTemp();
		var dataReg:ShaderRegisterElement = registerCache.getFreeFragmentConstant();
		var dataReg2:ShaderRegisterElement = registerCache.getFreeFragmentConstant();
		this._pNormalTextureRegister = registerCache.getFreeTextureReg();
		methodVO.texturesIndex = this._pNormalTextureRegister.index;
		methodVO.fragmentConstantsIndex = dataReg.index*4;

		return ShaderCompilerHelper.getTex2DSampleCode(targetReg, sharedRegisters, this._pNormalTextureRegister, this.normalMap, shaderObject.useSmoothTextures, shaderObject.repeatTextures, shaderObject.useMipmapping, sharedRegisters.uvVarying, "clamp") +

			"add " + temp + ", " + sharedRegisters.uvVarying + ", " + dataReg + ".xzzz\n" +

			ShaderCompilerHelper.getTex2DSampleCode(temp, sharedRegisters, this._pNormalTextureRegister, this.normalMap, shaderObject.useSmoothTextures, shaderObject.repeatTextures, shaderObject.useMipmapping, temp, "clamp") +

			"sub " + targetReg + ".x, " + targetReg + ".x, " + temp + ".x\n" +
			"add " + temp + ", " + sharedRegisters.uvVarying + ", " + dataReg + ".zyzz\n" +

			ShaderCompilerHelper.getTex2DSampleCode(temp, sharedRegisters, this._pNormalTextureRegister, this.normalMap, shaderObject.useSmoothTextures, shaderObject.repeatTextures, shaderObject.useMipmapping, temp, "clamp") +

			"sub " + targetReg + ".z, " + targetReg + ".z, " + temp + ".x\n" +
			"mov " + targetReg + ".y, " + dataReg + ".w\n" +
			"mul " + targetReg + ".xz, " + targetReg + ".xz, " + dataReg2 + ".xy\n" +
			"nrm " + targetReg + ".xyz, " + targetReg + ".xyz\n";
	}
}

export = NormalHeightMapMethod;