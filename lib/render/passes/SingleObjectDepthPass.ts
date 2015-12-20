import Image2D							= require("awayjs-core/lib/image/Image2D");
import Matrix3D							= require("awayjs-core/lib/geom/Matrix3D");

import LightBase						= require("awayjs-display/lib/base/LightBase");
import TriangleSubGeometry				= require("awayjs-display/lib/base/TriangleSubGeometry");
import Camera							= require("awayjs-display/lib/entities/Camera");
import MaterialBase						= require("awayjs-display/lib/materials/MaterialBase");
import IRenderOwner						= require("awayjs-display/lib/base/IRenderOwner");
import Single2DTexture					= require("awayjs-display/lib/textures/Single2DTexture");
import TextureBase						= require("awayjs-display/lib/textures/TextureBase");

import ContextGLDrawMode				= require("awayjs-stagegl/lib/base/ContextGLDrawMode");
import ContextGLProgramType				= require("awayjs-stagegl/lib/base/ContextGLProgramType");
import IContextGL						= require("awayjs-stagegl/lib/base/IContextGL");
import Stage							= require("awayjs-stagegl/lib/base/Stage");

import RendererBase						= require("awayjs-renderergl/lib/RendererBase");
import ShaderBase						= require("awayjs-renderergl/lib/shaders/ShaderBase");
import ShaderRegisterCache				= require("awayjs-renderergl/lib/shaders/ShaderRegisterCache");
import ShaderRegisterData				= require("awayjs-renderergl/lib/shaders/ShaderRegisterData");
import PassBase							= require("awayjs-renderergl/lib/render/passes/PassBase");
import IRenderableClass					= require("awayjs-renderergl/lib/renderables/IRenderableClass");
import RenderableBase					= require("awayjs-renderergl/lib/renderables/RenderableBase");
import RenderBase						= require("awayjs-renderergl/lib/render/RenderBase");
import SubGeometryVOBase				= require("awayjs-renderergl/lib/vos/SubGeometryVOBase");

/**
 * The SingleObjectDepthPass provides a material pass that renders a single object to a depth map from the point
 * of view from a light.
 */
class SingleObjectDepthPass extends PassBase
{
	private _textures:Object;
	private _projections:Object;
	private _textureSize:number /*uint*/ = 512;
	private _polyOffset:Float32Array = new Float32Array([15, 0, 0, 0]);
	private _enc:Float32Array;
	private _projectionTexturesInvalid:Boolean = true;

	/**
	 * The size of the depth map texture to render to.
	 */
	public get textureSize():number
	{
		return this._textureSize;
	}

	public set textureSize(value:number)
	{
		this._textureSize = value;
	}

	/**
	 * The amount by which the rendered object will be inflated, to prevent depth map rounding errors.
	 */
	public get polyOffset():number
	{
		return this._polyOffset[0];
	}

	public set polyOffset(value:number)
	{
		this._polyOffset[0] = value;
	}

	/**
	 * Creates a new SingleObjectDepthPass object.
	 */
	constructor(render:RenderBase, renderOwner:IRenderOwner, renderableClass:IRenderableClass, stage:Stage)
	{
		super(render, renderOwner, renderableClass, stage);

		//this._pNumUsedStreams = 2;
		//this._pNumUsedVertexConstants = 7;
		//this._enc = Array<number>(1.0, 255.0, 65025.0, 16581375.0, 1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
		//
		//this._pAnimatableAttributes = Array<string>("va0", "va1");
		//this._pAnimationTargetRegisters = Array<string>("vt0", "vt1");
	}

	/**
	 * @inheritDoc
	 */
	public dispose()
	{
		if (this._textures) {
			for (var key in this._textures) {
				var texture:TextureBase = this._textures[key];
				texture.dispose();
			}
			this._textures = null;
		}
	}

	/**
	 * Updates the projection textures used to contain the depth renders.
	 */
	private updateProjectionTextures()
	{
		if (this._textures) {
			for (var key in this._textures) {
				var texture:TextureBase = this._textures[key];
				texture.dispose();
			}
		}

		this._textures = new Object();
		this._projections = new Object();
		this._projectionTexturesInvalid = false;
	}

	/**
	 * @inheritDoc
	 */
	public _iGetVertexCode():string
	{
		var code:string;
		// offset
		code = "mul vt7, vt1, vc4.x	\n" +
				"add vt7, vt7, vt0\n" +
				"mov vt7.w, vt0.w\n";
		// project
		code += "m44 vt2, vt7, vc0\n" +
				"mov op, vt2\n";

		// perspective divide
		code += "div v0, vt2, vt2.w\n";

		return code;
	}

	/**
	 * @inheritDoc
	 */
	public _iGetFragmentCode(shader:ShaderBase, registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		var code:string = "";

		// encode float -> rgba
		code += "mul ft0, fc0, v0.z\n" +
				"frc ft0, ft0\n" +
				"mul ft1, ft0.yzww, fc1\n" +
				"sub ft0, ft0, ft1\n" +
				"mov oc, ft0\n";

		return code;
	}

	/**
	 * Gets the depth maps rendered for this object from all lights.
	 * @param renderable The renderable for which to retrieve the depth maps.
	 * @param stage3DProxy The Stage3DProxy object currently used for rendering.
	 * @return A list of depth map textures for all supported lights.
	 */
	public _iGetDepthMap(renderable:RenderableBase):TextureBase
	{
		return this._textures[renderable.renderableOwner.id];
	}

	/**
	 * Retrieves the depth map projection maps for all lights.
	 * @param renderable The renderable for which to retrieve the projection maps.
	 * @return A list of projection maps for all supported lights.
	 */
	public _iGetProjection(renderable:RenderableBase):Matrix3D
	{
		return this._projections[renderable.renderableOwner.id];
	}

	/**
	 * @inheritDoc
	 */
	public _iRender(renderable:RenderableBase, camera:Camera, viewProjection:Matrix3D)
	{
		var matrix:Matrix3D;
		var context:IContextGL = this._stage.context;
		var len:number /*uint*/;
		var light:LightBase;
		var lights:Array<LightBase> = this._renderOwner.lightPicker.allPickedLights;
		var rId:number = renderable.renderableOwner.id;

		if (!this._textures[rId])
			this._textures[rId] = new Single2DTexture(new Image2D(this._textureSize, this._textureSize));

		if (!this._projections[rId])
			this._projections[rId] = new Matrix3D();

		len = lights.length;

		// local position = enough
		light = lights[0];

		matrix = light.iGetObjectProjectionMatrix(renderable.sourceEntity, camera, this._projections[rId]);

		this._stage.setRenderTarget(this._textures[rId], true);
		context.clear(1.0, 1.0, 1.0);
		context.setProgramConstantsFromMatrix(ContextGLProgramType.VERTEX, 0, matrix, true);
		context.setProgramConstantsFromArray(ContextGLProgramType.FRAGMENT, 0, this._enc, 2);

		var subGeometryVO:SubGeometryVOBase = renderable.subGeometryVO;
		var subGeom:TriangleSubGeometry = <TriangleSubGeometry> subGeometryVO.subGeometry;

		subGeometryVO.activateVertexBufferVO(0, subGeom.positions);
		subGeometryVO.activateVertexBufferVO(1, subGeom.normals);
		subGeometryVO.getIndexBufferVO().draw(ContextGLDrawMode.TRIANGLES, 0, subGeometryVO.subGeometry.numElements);
	}

	/**
	 * @inheritDoc
	 */
	public _iActivate(camera:Camera)
	{
		if (this._projectionTexturesInvalid)
			this.updateProjectionTextures();

		// never scale
		super._iActivate(camera);

		this._stage.context.setProgramConstantsFromArray(ContextGLProgramType.VERTEX, 4, this._polyOffset, 1);
	}
}

export = SingleObjectDepthPass;