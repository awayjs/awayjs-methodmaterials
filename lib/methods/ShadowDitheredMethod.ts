import BitmapImage2D					= require("awayjs-core/lib/data/BitmapImage2D");

import DirectionalLight					= require("awayjs-display/lib/entities/DirectionalLight");
import Single2DTexture					= require("awayjs-display/lib/textures/Single2DTexture");

import Stage							= require("awayjs-stagegl/lib/base/Stage");

import ShaderLightingObject				= require("awayjs-renderergl/lib/compilation/ShaderLightingObject");
import ShaderObjectBase					= require("awayjs-renderergl/lib/compilation/ShaderObjectBase");
import ShaderRegisterCache				= require("awayjs-renderergl/lib/compilation/ShaderRegisterCache");
import ShaderRegisterData				= require("awayjs-renderergl/lib/compilation/ShaderRegisterData");
import ShaderRegisterElement			= require("awayjs-renderergl/lib/compilation/ShaderRegisterElement");

import MethodVO							= require("awayjs-methodmaterials/lib/data/MethodVO");
import ShadowMethodBase					= require("awayjs-methodmaterials/lib/methods/ShadowMethodBase");

/**
 * ShadowDitheredMethod provides a soft shadowing technique by randomly distributing sample points differently for each fragment.
 */
class ShadowDitheredMethod extends ShadowMethodBase
{
	private static _grainTexture:Single2DTexture;
	private static _grainUsages:number /*int*/;
	private static _grainBitmapImage2D:BitmapImage2D;
	private _depthMapSize:number /*int*/;
	private _range:number;
	private _numSamples:number /*int*/;

	/**
	 * Creates a new ShadowDitheredMethod object.
	 * @param castingLight The light casting the shadows
	 * @param numSamples The amount of samples to take for dithering. Minimum 1, maximum 24.
	 */
	constructor(castingLight:DirectionalLight, numSamples:number /*int*/ = 4, range:number = 1)
	{
		super(castingLight);

		this._depthMapSize = this._pCastingLight.shadowMapper.depthMapSize;

		this.numSamples = numSamples;
		this.range = range;

		++ShadowDitheredMethod._grainUsages;

		if (!ShadowDitheredMethod._grainTexture)
			this.initGrainTexture();
	}

	/**
	 * The amount of samples to take for dithering. Minimum 1, maximum 24. The actual maximum may depend on the
	 * complexity of the shader.
	 */
	public get numSamples():number /*int*/
	{
		return this._numSamples;
	}

	public set numSamples(value:number /*int*/)
	{
		if (value < 1)
			value = 1;
		else if (value > 24)
			value = 24;

		if (this._numSamples == value)
			return;

		this._numSamples = value;

		this.iInvalidateShaderProgram();
	}

	/**
	 * @inheritDoc
	 */
	public iInitVO(shaderObject:ShaderLightingObject, methodVO:MethodVO)
	{
		super.iInitVO(shaderObject, methodVO);

		methodVO.needsProjection = true;

		methodVO.secondaryTextureObject = shaderObject.getTextureObject(ShadowDitheredMethod._grainTexture);
	}

	/**
	 * @inheritDoc
	 */
	public iInitConstants(shaderObject:ShaderObjectBase, methodVO:MethodVO)
	{
		super.iInitConstants(shaderObject, methodVO);

		var fragmentData:Array<number> = shaderObject.fragmentConstantData;
		var index:number /*int*/ = methodVO.fragmentConstantsIndex;
		fragmentData[index + 8] = 1/this._numSamples;
	}

	/**
	 * The range in the shadow map in which to distribute the samples.
	 */
	public get range():number
	{
		return this._range*2;
	}

	public set range(value:number)
	{
		this._range = value/2;
	}

	/**
	 * Creates a texture containing the dithering noise texture.
	 */
	private initGrainTexture()
	{
		ShadowDitheredMethod._grainBitmapImage2D = new BitmapImage2D(64, 64, false);
		var vec:Array<number> /*uint*/ = new Array<number>();
		var len:number /*uint*/ = 4096;
		var step:number = 1/(this._depthMapSize*this._range);
		var r:number, g:number;

		for (var i:number /*uint*/ = 0; i < len; ++i) {
			r = 2*(Math.random() - .5);
			g = 2*(Math.random() - .5);
			if (r < 0)
				r -= step; else
				r += step;
			if (g < 0)
				g -= step; else
				g += step;
			if (r > 1)
				r = 1; else if (r < -1)
				r = -1;
			if (g > 1)
				g = 1; else if (g < -1)
				g = -1;
			vec[i] = (Math.floor((r*.5 + .5)*0xff) << 16) | (Math.floor((g*.5 + .5)*0xff) << 8);
		}

		ShadowDitheredMethod._grainBitmapImage2D.setArray(ShadowDitheredMethod._grainBitmapImage2D.rect, vec);
		ShadowDitheredMethod._grainTexture = new Single2DTexture(ShadowDitheredMethod._grainBitmapImage2D);
	}

	/**
	 * @inheritDoc
	 */
	public dispose()
	{
		if (--ShadowDitheredMethod._grainUsages == 0) {
			ShadowDitheredMethod._grainTexture.dispose();
			ShadowDitheredMethod._grainBitmapImage2D.dispose();
			ShadowDitheredMethod._grainTexture = null;
		}
	}

	/**
	 * @inheritDoc
	 */
	public iActivate(shaderObject:ShaderObjectBase, methodVO:MethodVO, stage:Stage)
	{
		super.iActivate(shaderObject, methodVO, stage);

		var data:Array<number> = shaderObject.fragmentConstantData;
		var index:number /*uint*/ = methodVO.fragmentConstantsIndex;
		data[index + 9] = (stage.width - 1)/63;
		data[index + 10] = (stage.height - 1)/63;
		data[index + 11] = 2*this._range/this._depthMapSize;

		methodVO.secondaryTextureObject.activate(shaderObject);
	}

	/**
	 * @inheritDoc
	 */
	public _pGetPlanarFragmentCode(shaderObject:ShaderObjectBase, methodVO:MethodVO, targetReg:ShaderRegisterElement, regCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		var decReg:ShaderRegisterElement = regCache.getFreeFragmentConstant();
		var dataReg:ShaderRegisterElement = regCache.getFreeFragmentConstant();
		var customDataReg:ShaderRegisterElement = regCache.getFreeFragmentConstant();

		methodVO.fragmentConstantsIndex = decReg.index*4;

		return this.getSampleCode(shaderObject, methodVO, customDataReg, decReg, targetReg, regCache, sharedRegisters);
	}

	/**
	 * Get the actual shader code for shadow mapping
	 * @param regCache The register cache managing the registers.
	 * @param depthMapRegister The texture register containing the depth map.
	 * @param decReg The register containing the depth map decoding data.
	 * @param targetReg The target register to add the shadow coverage.
	 */
	private getSampleCode(shaderObject:ShaderObjectBase, methodVO:MethodVO, customDataReg:ShaderRegisterElement, decReg:ShaderRegisterElement, targetReg:ShaderRegisterElement, regCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		var code:string = "";
		var numSamples:number /*int*/ = this._numSamples;
		var uvReg:ShaderRegisterElement = regCache.getFreeFragmentVectorTemp();
		regCache.addFragmentTempUsages(uvReg, 1);
		var temp:ShaderRegisterElement = regCache.getFreeFragmentVectorTemp();
		regCache.addFragmentTempUsages(temp, 1);

		var projectionReg:ShaderRegisterElement = sharedRegisters.projectionFragment;

		methodVO.textureObject._iInitRegisters(shaderObject, regCache);
		methodVO.secondaryTextureObject._iInitRegisters(shaderObject, regCache);

		code += "div " + uvReg + ", " + projectionReg + ", " + projectionReg + ".w\n" +
			"mul " + uvReg + ".xy, " + uvReg + ".xy, " + customDataReg + ".yz\n";

		while (numSamples > 0) {
			if (numSamples == this._numSamples) {
				code += methodVO.secondaryTextureObject._iGetFragmentCode(shaderObject, uvReg, regCache, uvReg);
			} else {
				code += "mov " + temp + ", " + uvReg + ".zwxy \n" +
					methodVO.secondaryTextureObject._iGetFragmentCode(shaderObject, uvReg, regCache, temp);
			}

			// keep grain in uvReg.zw
			code += "sub " + uvReg + ".zw, " + uvReg + ".xy, fc0.xx\n" + // uv-.5
				"mul " + uvReg + ".zw, " + uvReg + ".zw, " + customDataReg + ".w\n"; // (tex unpack scale and tex scale in one)

			if (numSamples == this._numSamples) {
				// first sample
				code += "add " + uvReg + ".xy, " + uvReg + ".zw, " + this._pDepthMapCoordReg + ".xy\n" +
					methodVO.textureObject._iGetFragmentCode(shaderObject, temp, regCache, uvReg) +
					"dp4 " + temp + ".z, " + temp + ", " + decReg + "\n" +
					"slt " + targetReg + ".w, " + this._pDepthMapCoordReg + ".z, " + temp + ".z\n"; // 0 if in shadow
			} else {
				code += this.addSample(shaderObject, methodVO, uvReg, decReg, targetReg, regCache);
			}

			if (numSamples > 4)
				code += "add " + uvReg + ".xy, " + uvReg + ".xy, " + uvReg + ".zw\n" + this.addSample(shaderObject, methodVO, uvReg, decReg, targetReg, regCache);

			if (numSamples > 1)
				code += "sub " + uvReg + ".xy, " + this._pDepthMapCoordReg + ".xy, " + uvReg + ".zw\n" + this.addSample(shaderObject, methodVO, uvReg, decReg, targetReg, regCache);

			if (numSamples > 5)
				code += "sub " + uvReg + ".xy, " + uvReg + ".xy, " + uvReg + ".zw\n" + this.addSample(shaderObject, methodVO, uvReg, decReg, targetReg, regCache);

			if (numSamples > 2) {
				code += "neg " + uvReg + ".w, " + uvReg + ".w\n"; // will be rotated 90 degrees when being accessed as wz
				code += "add " + uvReg + ".xy, " + uvReg + ".wz, " + this._pDepthMapCoordReg + ".xy\n" + this.addSample(shaderObject, methodVO, uvReg, decReg, targetReg, regCache);
			}

			if (numSamples > 6)
				code += "add " + uvReg + ".xy, " + uvReg + ".xy, " + uvReg + ".wz\n" + this.addSample(shaderObject, methodVO, uvReg, decReg, targetReg, regCache);

			if (numSamples > 3)
				code += "sub " + uvReg + ".xy, " + this._pDepthMapCoordReg + ".xy, " + uvReg + ".wz\n" + this.addSample(shaderObject, methodVO, uvReg, decReg, targetReg, regCache);

			if (numSamples > 7)
				code += "sub " + uvReg + ".xy, " + uvReg + ".xy, " + uvReg + ".wz\n" + this.addSample(shaderObject, methodVO, uvReg, decReg, targetReg, regCache);

			numSamples -= 8;
		}

		regCache.removeFragmentTempUsage(temp);
		regCache.removeFragmentTempUsage(uvReg);
		code += "mul " + targetReg + ".w, " + targetReg + ".w, " + customDataReg + ".x\n"; // average
		return code;
	}

	/**
	 * Adds the code for another tap to the shader code.
	 * @param uvReg The uv register for the tap.
	 * @param depthMapRegister The texture register containing the depth map.
	 * @param decReg The register containing the depth map decoding data.
	 * @param targetReg The target register to add the tap comparison result.
	 * @param regCache The register cache managing the registers.
	 * @return
	 */
	private addSample(shaderObject:ShaderObjectBase, methodVO:MethodVO, uvReg:ShaderRegisterElement, decReg:ShaderRegisterElement, targetReg:ShaderRegisterElement, regCache:ShaderRegisterCache):string
	{
		var temp:ShaderRegisterElement = regCache.getFreeFragmentVectorTemp();

		return methodVO.textureObject._iGetFragmentCode(shaderObject, temp, regCache, uvReg) +
			"dp4 " + temp + ".z, " + temp + ", " + decReg + "\n" +
			"slt " + temp + ".z, " + this._pDepthMapCoordReg + ".z, " + temp + ".z\n" + // 0 if in shadow
			"add " + targetReg + ".w, " + targetReg + ".w, " + temp + ".z\n";
	}

	/**
	 * @inheritDoc
	 */
	public iActivateForCascade(shaderObject:ShaderObjectBase, methodVO:MethodVO, stage:Stage)
	{
		var data:Array<number> = shaderObject.fragmentConstantData;
		var index:number /*uint*/ = methodVO.secondaryFragmentConstantsIndex;
		data[index] = 1/this._numSamples;
		data[index + 1] = (stage.width - 1)/63;
		data[index + 2] = (stage.height - 1)/63;
		data[index + 3] = 2*this._range/this._depthMapSize;

		methodVO.secondaryTextureObject.activate(shaderObject);
	}

	/**
	 * @inheritDoc
	 */
	public _iGetCascadeFragmentCode(shaderObject:ShaderObjectBase, methodVO:MethodVO, decodeRegister:ShaderRegisterElement, depthProjection:ShaderRegisterElement, targetRegister:ShaderRegisterElement, registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		this._pDepthMapCoordReg = depthProjection;

		var dataReg:ShaderRegisterElement = registerCache.getFreeFragmentConstant();
		methodVO.secondaryFragmentConstantsIndex = dataReg.index*4;

		return this.getSampleCode(shaderObject, methodVO, dataReg, decodeRegister, targetRegister, registerCache, sharedRegisters);
	}
}

export = ShadowDitheredMethod;