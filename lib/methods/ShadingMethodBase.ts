import AssetBase					= require("awayjs-core/lib/library/AssetBase");

import Camera						= require("awayjs-display/lib/entities/Camera");

import Stage						= require("awayjs-stagegl/lib/base/Stage");

import RenderableBase				= require("awayjs-renderergl/lib/renderables/RenderableBase");
import ShadingMethodEvent			= require("awayjs-renderergl/lib/events/ShadingMethodEvent");
import ShaderBase					= require("awayjs-renderergl/lib/shaders/ShaderBase");
import ShaderRegisterCache			= require("awayjs-renderergl/lib/shaders/ShaderRegisterCache");
import ShaderRegisterData			= require("awayjs-renderergl/lib/shaders/ShaderRegisterData");
import ShaderRegisterElement		= require("awayjs-renderergl/lib/shaders/ShaderRegisterElement");

import MethodVO						= require("awayjs-methodmaterials/lib/data/MethodVO");


/**
 * ShadingMethodBase provides an abstract base method for shading methods, used by compiled passes to compile
 * the final shading program.
 */
class ShadingMethodBase extends AssetBase
{
	public static assetType:string = "[asset ShadingMethod]";

	/**
	 * @inheritDoc
	 */
	public get assetType():string
	{
		return ShadingMethodBase.assetType;
	}

	/**
	 * Create a new ShadingMethodBase object.
	 */
	constructor()
	{
		super();
	}

	public iIsUsed(shader:ShaderBase):boolean
	{
		return true;
	}

	/**
	 * Initializes the properties for a MethodVO, including register and texture indices.
	 *
	 * @param methodVO The MethodVO object linking this method with the pass currently being compiled.
	 *
	 * @internal
	 */
	public iInitVO(shader:ShaderBase, methodVO:MethodVO)
	{

	}

	/**
	 * Initializes unchanging shader constants using the data from a MethodVO.
	 *
	 * @param methodVO The MethodVO object linking this method with the pass currently being compiled.
	 *
	 * @internal
	 */
	public iInitConstants(shader:ShaderBase, methodVO:MethodVO)
	{


	}

	/**
	 * Indicates whether or not this method expects normals in tangent space. Override for object-space normals.
	 */
	public iUsesTangentSpace():boolean
	{
		return true;
	}

	/**
	 * Cleans up any resources used by the current object.
	 */
	public dispose()
	{

	}

	/**
	 * Resets the compilation state of the method.
	 *
	 * @internal
	 */
	public iReset()
	{
		this.iCleanCompilationData();
	}

	/**
	 * Resets the method's state for compilation.
	 *
	 * @internal
	 */
	public iCleanCompilationData()
	{
	}

	/**
	 * Get the vertex shader code for this method.
	 * @param vo The MethodVO object linking this method with the pass currently being compiled.
	 * @param regCache The register cache used during the compilation.
	 *
	 * @internal
	 */
	public iGetVertexCode(shader:ShaderBase, methodVO:MethodVO, registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		return "";
	}

	/**
	 * @inheritDoc
	 */
	public iGetFragmentCode(shader:ShaderBase, methodVO:MethodVO, targetReg:ShaderRegisterElement, registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		return null;
	}

	/**
	 * Sets the render state for this method.
	 *
	 * @param methodVO The MethodVO object linking this method with the pass currently being compiled.
	 * @param stage The Stage object currently used for rendering.
	 *
	 * @internal
	 */
	public iActivate(shader:ShaderBase, methodVO:MethodVO, stage:Stage)
	{

	}

	/**
	 * Sets the render state for a single renderable.
	 *
	 * @param vo The MethodVO object linking this method with the pass currently being compiled.
	 * @param renderable The renderable currently being rendered.
	 * @param stage The Stage object currently used for rendering.
	 * @param camera The camera from which the scene is currently rendered.
	 *
	 * @internal
	 */
	public iSetRenderState(shader:ShaderBase, methodVO:MethodVO, renderable:RenderableBase, stage:Stage, camera:Camera)
	{

	}

	/**
	 * Clears the render state for this method.
	 * @param vo The MethodVO object linking this method with the pass currently being compiled.
	 * @param stage The Stage object currently used for rendering.
	 *
	 * @internal
	 */
	public iDeactivate(shader:ShaderBase, methodVO:MethodVO, stage:Stage)
	{

	}

	/**
	 * Marks the shader program as invalid, so it will be recompiled before the next render.
	 *
	 * @internal
	 */
	public iInvalidateShaderProgram()
	{
		this.dispatchEvent(new ShadingMethodEvent(ShadingMethodEvent.SHADER_INVALIDATED));
	}

	/**
	 * Copies the state from a ShadingMethodBase object into the current object.
	 */
	public copyFrom(method:ShadingMethodBase)
	{
	}
}

export = ShadingMethodBase;