import {Matrix3D, ProjectionBase} from "@awayjs/core";

import {ShaderRegisterCache, ShaderRegisterData} from "@awayjs/stage";

import {RenderStateBase, PassEvent, IRenderable, IAnimationSet, IPass, ShaderBase} from "@awayjs/renderer";

import {GL_MaterialBase} from "../GL_MaterialBase";

/**
 * GL_MaterialPassBase provides an abstract base class for material shader passes. A material pass constitutes at least
 * a render call per required renderable.
 */
export class GL_MaterialPassBase extends GL_MaterialBase implements IPass
{
	public _shader:ShaderBase;

	public get shader():ShaderBase
	{
		return this._shader;
	}

	public get animationSet():IAnimationSet
	{
		return <IAnimationSet> this._material.animationSet;
	}

    public get numUsedStreams():number
    {
        return this._shader.numUsedStreams;
    }

    public get numUsedTextures():number
    {
        return this._shader.numUsedTextures;
    }

	/**
	 * Marks the shader program as invalid, so it will be recompiled before the next render.
	 */
	public invalidate():void
	{
		this._shader.invalidateProgram();

		this.dispatchEvent(new PassEvent(PassEvent.INVALIDATE, this));
	}

	public dispose():void
	{
		if (this._shader) {
			this._shader.dispose();
			this._shader = null;
		}
	}

	/**
	 * Renders the current pass. Before calling pass, activatePass needs to be called with the same index.
	 * @param pass The pass used to render the renderable.
	 * @param renderable The IRenderable object to draw.
	 * @param stage The Stage object used for rendering.
	 * @param entityCollector The EntityCollector object that contains the visible scene data.
	 * @param viewProjection The view-projection matrix used to project to the screen. This is not the same as
	 * camera.viewProjection as it includes the scaling factors when rendering to textures.
	 *
	 * @internal
	 */
	public _setRenderState(renderState:RenderStateBase, projection:ProjectionBase):void
	{
		this._shader._setRenderState(renderState, projection);
	}

	/**
	 * Sets the render state for the pass that is independent of the rendered object. This needs to be called before
	 * calling pass. Before activating a pass, the previously used pass needs to be deactivated.
	 * @param stage The Stage object which is currently used for rendering.
	 * @param camera The camera from which the scene is viewed.
	 * @private
	 */
	public _activate(projection:ProjectionBase):void
	{
		this._shader._activate(projection);
	}

	/**
	 * Clears the render state for the pass. This needs to be called before activating another pass.
	 * @param stage The Stage used for rendering
	 *
	 * @private
	 */
	public _deactivate():void
	{
		this._shader._deactivate();
	}

	public _initConstantData():void
	{

	}

	public _getVertexCode(registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		return "";
	}

	public _getFragmentCode(registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		return "";
	}

	public _getPostAnimationFragmentCode(registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		return "";
	}

	public _getNormalVertexCode(registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		return "";
	}

	public _getNormalFragmentCode(registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		return "";
	}
}