import CubeTextureBase					= require("awayjs-core/lib/textures/CubeTextureBase");

import Stage							= require("awayjs-stagegl/lib/base/Stage");

import ShaderObjectBase					= require("awayjs-renderergl/lib/compilation/ShaderObjectBase");
import ShaderRegisterCache				= require("awayjs-renderergl/lib/compilation/ShaderRegisterCache");
import ShaderRegisterData				= require("awayjs-renderergl/lib/compilation/ShaderRegisterData");
import ShaderRegisterElement			= require("awayjs-renderergl/lib/compilation/ShaderRegisterElement");
import ShaderCompilerHelper				= require("awayjs-renderergl/lib/utils/ShaderCompilerHelper");

import MethodVO							= require("awayjs-methodmaterials/lib/data/MethodVO");
import AmbientBasicMethod				= require("awayjs-methodmaterials/lib/methods/AmbientBasicMethod");

/**
 * AmbientEnvMapMethod provides a diffuse shading method that uses a diffuse irradiance environment map to
 * approximate global lighting rather than lights.
 */
class AmbientEnvMapMethod extends AmbientBasicMethod
{
	private _cubeTexture:CubeTextureBase;
	
	/**
	 * Creates a new <code>AmbientEnvMapMethod</code> object.
	 *
	 * @param envMap The cube environment map to use for the ambient lighting.
	 */
	constructor(envMap:CubeTextureBase)
	{
		super();
		this._cubeTexture = envMap;
	}

	/**
	 * @inheritDoc
	 */
	public iInitVO(shaderObject:ShaderObjectBase, methodVO:MethodVO)
	{
		super.iInitVO(shaderObject, methodVO);

		methodVO.needsNormals = true;
	}
	
	/**
	 * The cube environment map to use for the diffuse lighting.
	 */
	public get envMap():CubeTextureBase
	{
		return this._cubeTexture;
	}
	
	public set envMap(value:CubeTextureBase)
	{
		this._cubeTexture = value;
	}
	
	/**
	 * @inheritDoc
	 */
	public iActivate(shaderObject:ShaderObjectBase, methodVO:MethodVO, stage:Stage)
	{
		super.iActivate(shaderObject, methodVO, stage);

		stage.activateCubeTexture(methodVO.texturesIndex, this._cubeTexture);
	}
	
	/**
	 * @inheritDoc
	 */
	public iGetFragmentCode(shaderObject:ShaderObjectBase, methodVO:MethodVO, targetReg:ShaderRegisterElement, regCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		var code:string = "";
		var ambientInputRegister:ShaderRegisterElement;
		var cubeMapReg:ShaderRegisterElement = regCache.getFreeTextureReg();
		methodVO.texturesIndex = cubeMapReg.index;
		
		code += ShaderCompilerHelper.getTexCubeSampleCode(targetReg, cubeMapReg, this._cubeTexture, shaderObject.useSmoothTextures, shaderObject.useMipmapping, sharedRegisters.normalFragment);

		ambientInputRegister = regCache.getFreeFragmentConstant();
		methodVO.fragmentConstantsIndex = ambientInputRegister.index;
		
		code += "add " + targetReg + ".xyz, " + targetReg + ".xyz, " + ambientInputRegister + ".xyz\n";
		
		return code;
	}
}

export = AmbientEnvMapMethod;