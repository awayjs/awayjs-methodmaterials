import Event							= require("awayjs-core/lib/events/Event");

import Camera							= require("awayjs-display/lib/entities/Camera");
import DirectionalLight					= require("awayjs-display/lib/entities/DirectionalLight");
import CascadeShadowMapper				= require("awayjs-display/lib/materials/shadowmappers/CascadeShadowMapper");
import TextureBase						= require("awayjs-display/lib/textures/TextureBase");

import Stage							= require("awayjs-stagegl/lib/base/Stage");

import RenderableBase					= require("awayjs-renderergl/lib/renderables/RenderableBase");
import ShadingMethodEvent				= require("awayjs-renderergl/lib/events/ShadingMethodEvent");
import LightingShader					= require("awayjs-renderergl/lib/shaders/LightingShader");
import ShaderBase						= require("awayjs-renderergl/lib/shaders/ShaderBase");
import ShaderRegisterCache				= require("awayjs-renderergl/lib/shaders/ShaderRegisterCache");
import ShaderRegisterData				= require("awayjs-renderergl/lib/shaders/ShaderRegisterData");
import ShaderRegisterElement			= require("awayjs-renderergl/lib/shaders/ShaderRegisterElement");

import MethodVO							= require("awayjs-methodmaterials/lib/data/MethodVO");
import ShadowMapMethodBase				= require("awayjs-methodmaterials/lib/methods/ShadowMapMethodBase");
import ShadowMethodBase					= require("awayjs-methodmaterials/lib/methods/ShadowMethodBase");

/**
 * ShadowCascadeMethod is a shadow map method to apply cascade shadow mapping on materials.
 * Must be used with a DirectionalLight with a CascadeShadowMapper assigned to its shadowMapper property.
 *
 * @see away.lights.CascadeShadowMapper
 */
class ShadowCascadeMethod extends ShadowMapMethodBase
{
	private _baseMethod:ShadowMethodBase;
	private _cascadeShadowMapper:CascadeShadowMapper;
	private _depthMapCoordVaryings:Array<ShaderRegisterElement>;
	private _cascadeProjections:Array<ShaderRegisterElement>;

	/**
	 * Creates a new ShadowCascadeMethod object.
	 *
	 * @param shadowMethodBase The shadow map sampling method used to sample individual cascades (fe: ShadowHardMethod, ShadowSoftMethod)
	 */
	constructor(shadowMethodBase:ShadowMethodBase)
	{
		super(shadowMethodBase.castingLight);

		this._baseMethod = shadowMethodBase;
		if (!(this._pCastingLight instanceof DirectionalLight))
			throw new Error("ShadowCascadeMethod is only compatible with DirectionalLight");

		this._cascadeShadowMapper = <CascadeShadowMapper> this._pCastingLight.shadowMapper;

		if (!this._cascadeShadowMapper)
			throw new Error("ShadowCascadeMethod requires a light that has a CascadeShadowMapper instance assigned to shadowMapper.");

		this._cascadeShadowMapper.addEventListener(Event.CHANGE, (event:Event) => this.onCascadeChange(event));
		this._baseMethod.addEventListener(ShadingMethodEvent.SHADER_INVALIDATED, (event:ShadingMethodEvent) => this.onShaderInvalidated(event));
	}

	/**
	 * The shadow map sampling method used to sample individual cascades. These are typically those used in conjunction
	 * with a DirectionalShadowMapper.
	 *
	 * @see ShadowHardMethod
	 * @see ShadowSoftMethod
	 */
	public get baseMethod():ShadowMethodBase
	{
		return this._baseMethod;
	}

	public set baseMethod(value:ShadowMethodBase)
	{
		if (this._baseMethod == value)
			return;

		this._baseMethod.removeEventListener(ShadingMethodEvent.SHADER_INVALIDATED, (event:ShadingMethodEvent) => this.onShaderInvalidated(event));

		this._baseMethod = value;

		this._baseMethod.addEventListener(ShadingMethodEvent.SHADER_INVALIDATED, (event:ShadingMethodEvent) => this.onShaderInvalidated(event));

		this.iInvalidateShaderProgram();
	}

	/**
	 * @inheritDoc
	 */
	public iInitVO(shader:LightingShader, methodVO:MethodVO)
	{
		var tempVO:MethodVO = new MethodVO(this._baseMethod);
		this._baseMethod.iInitVO(shader, tempVO);

		methodVO.needsGlobalVertexPos = true;
		methodVO.needsProjection = true;

		methodVO.textureVO = shader.getTextureVO(this._pCastingLight.shadowMapper.depthMap);
	}

	/**
	 * @inheritDoc
	 */
	public iInitConstants(shader:ShaderBase, methodVO:MethodVO)
	{
		var fragmentData:Array<number> = shader.fragmentConstantData;
		var vertexData:Array<number> = shader.vertexConstantData;
		var index:number = methodVO.fragmentConstantsIndex;
		fragmentData[index] = 1.0;
		fragmentData[index + 1] = 1/255.0;
		fragmentData[index + 2] = 1/65025.0;
		fragmentData[index + 3] = 1/16581375.0;

		fragmentData[index + 6] = .5;
		fragmentData[index + 7] = -.5;

		index = methodVO.vertexConstantsIndex;
		vertexData[index] = .5;
		vertexData[index + 1] = -.5;
		vertexData[index + 2] = 0;
	}

	/**
	 * @inheritDoc
	 */
	public iCleanCompilationData()
	{
		super.iCleanCompilationData();
		this._cascadeProjections = null;
		this._depthMapCoordVaryings = null;
	}

	/**
	 * @inheritDoc
	 */
	public iGetVertexCode(shader:ShaderBase, methodVO:MethodVO, registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		var code:string = "";
		var dataReg:ShaderRegisterElement = registerCache.getFreeVertexConstant();

		this.initProjectionsRegs(registerCache);
		methodVO.vertexConstantsIndex = dataReg.index*4;

		var temp:ShaderRegisterElement = registerCache.getFreeVertexVectorTemp();

		for (var i:number = 0; i < this._cascadeShadowMapper.numCascades; ++i) {
			code += "m44 " + temp + ", " + sharedRegisters.globalPositionVertex + ", " + this._cascadeProjections[i] + "\n" +
				"add " + this._depthMapCoordVaryings[i] + ", " + temp + ", " + dataReg + ".zzwz\n";
		}

		return code;
	}

	/**
	 * Creates the registers for the cascades' projection coordinates.
	 */
	private initProjectionsRegs(registerCache:ShaderRegisterCache)
	{
		this._cascadeProjections = new Array<ShaderRegisterElement>(this._cascadeShadowMapper.numCascades);
		this._depthMapCoordVaryings = new Array<ShaderRegisterElement>(this._cascadeShadowMapper.numCascades);

		for (var i:number = 0; i < this._cascadeShadowMapper.numCascades; ++i) {
			this._depthMapCoordVaryings[i] = registerCache.getFreeVarying();
			this._cascadeProjections[i] = registerCache.getFreeVertexConstant();
			registerCache.getFreeVertexConstant();
			registerCache.getFreeVertexConstant();
			registerCache.getFreeVertexConstant();
		}
	}

	/**
	 * @inheritDoc
	 */
	public iGetFragmentCode(shader:ShaderBase, methodVO:MethodVO, targetReg:ShaderRegisterElement, registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		var numCascades:number = this._cascadeShadowMapper.numCascades;
		var decReg:ShaderRegisterElement = registerCache.getFreeFragmentConstant();
		var dataReg:ShaderRegisterElement = registerCache.getFreeFragmentConstant();
		var planeDistanceReg:ShaderRegisterElement = registerCache.getFreeFragmentConstant();
		var planeDistances:Array<string> = Array<string>( planeDistanceReg + ".x", planeDistanceReg + ".y", planeDistanceReg + ".z", planeDistanceReg + ".w" );
		var code:string;

		methodVO.fragmentConstantsIndex = decReg.index*4;

		var inQuad:ShaderRegisterElement = registerCache.getFreeFragmentVectorTemp();
		registerCache.addFragmentTempUsages(inQuad, 1);
		var uvCoord:ShaderRegisterElement = registerCache.getFreeFragmentVectorTemp();
		registerCache.addFragmentTempUsages(uvCoord, 1);

		// assume lowest partition is selected, will be overwritten later otherwise
		code = "mov " + uvCoord + ", " + this._depthMapCoordVaryings[numCascades - 1] + "\n";

		for (var i:number = numCascades - 2; i >= 0; --i) {
			var uvProjection:ShaderRegisterElement = this._depthMapCoordVaryings[i];

			// calculate if in texturemap (result == 0 or 1, only 1 for a single partition)
			code += "slt " + inQuad + ".z, " + sharedRegisters.projectionFragment + ".z, " + planeDistances[i] + "\n"; // z = x > minX, w = y > minY

			var temp:ShaderRegisterElement = registerCache.getFreeFragmentVectorTemp();

			// linearly interpolate between old and new uv coords using predicate value == conditional toggle to new value if predicate == 1 (true)
			code += "sub " + temp + ", " + uvProjection + ", " + uvCoord + "\n" +
				"mul " + temp + ", " + temp + ", " + inQuad + ".z\n" +
				"add " + uvCoord + ", " + uvCoord + ", " + temp + "\n";
		}

		registerCache.removeFragmentTempUsage(inQuad);

		code += "div " + uvCoord + ", " + uvCoord + ", " + uvCoord + ".w\n" +
			"mul " + uvCoord + ".xy, " + uvCoord + ".xy, " + dataReg + ".zw\n" +
			"add " + uvCoord + ".xy, " + uvCoord + ".xy, " + dataReg + ".zz\n";

		code += this._baseMethod._iGetCascadeFragmentCode(shader, methodVO, decReg, uvCoord, targetReg, registerCache, sharedRegisters) +
			"add " + targetReg + ".w, " + targetReg + ".w, " + dataReg + ".y\n";

		registerCache.removeFragmentTempUsage(uvCoord);

		return code;
	}

	/**
	 * @inheritDoc
	 */
	public iActivate(shader:ShaderBase, methodVO:MethodVO, stage:Stage)
	{
		methodVO.textureVO.activate(shader);

		var vertexData:Array<number> = shader.vertexConstantData;
		var vertexIndex:number = methodVO.vertexConstantsIndex;

		shader.vertexConstantData[methodVO.vertexConstantsIndex + 3] = -1/(this._cascadeShadowMapper.depth*this._pEpsilon);

		var numCascades:number = this._cascadeShadowMapper.numCascades;
		vertexIndex += 4;
		for (var k:number = 0; k < numCascades; ++k) {
			this._cascadeShadowMapper.getDepthProjections(k).copyRawDataTo(vertexData, vertexIndex, true);
			vertexIndex += 16;
		}

		var fragmentData:Array<number> = shader.fragmentConstantData;
		var fragmentIndex:number = methodVO.fragmentConstantsIndex;
		fragmentData[fragmentIndex + 5] = 1 - this._pAlpha;

		var nearPlaneDistances:Array<number> = this._cascadeShadowMapper._iNearPlaneDistances;

		fragmentIndex += 8;
		for (var i:number = 0; i < numCascades; ++i)
			fragmentData[fragmentIndex + i] = nearPlaneDistances[i];

		this._baseMethod.iActivateForCascade(shader, methodVO, stage);
	}

	/**
	 * @inheritDoc
	 */
	public iSetRenderState(shader:ShaderBase, methodVO:MethodVO, renderable:RenderableBase, stage:Stage, camera:Camera)
	{
	}

	/**
	 * Called when the shadow mappers cascade configuration changes.
	 */
	private onCascadeChange(event:Event)
	{
		this.iInvalidateShaderProgram();
	}

	/**
	 * Called when the base method's shader code is invalidated.
	 */
	private onShaderInvalidated(event:ShadingMethodEvent)
	{
		this.iInvalidateShaderProgram();
	}
}

export = ShadowCascadeMethod;