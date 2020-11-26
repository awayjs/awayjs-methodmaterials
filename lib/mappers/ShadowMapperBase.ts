import { AbstractMethodError, ProjectionBase } from '@awayjs/core';

import { View, PartitionBase } from '@awayjs/view';

import { IMapper, RenderGroup } from '@awayjs/renderer';

import { TextureBase } from '../textures/TextureBase';
import { LightBase } from '../lights/LightBase';

import { MethodBase, _Shader_MethodBase } from '../methods/MethodBase';

export class ShadowMapperBase extends MethodBase implements IMapper {
	protected _textureMap: TextureBase;
	protected _size: number;
	protected _light: LightBase;
	protected _epsilon: number = .02;
	protected _alpha: number = 1;

	public autoUpdate: boolean = true;

	public get textureMap(): TextureBase {
		return this._textureMap;
	}

	/**
     * The "transparency" of the shadows. This allows making shadows less strong.
     */
	public get alpha(): number {
		return this._alpha;
	}

	public set alpha(value: number) {
		this._alpha = value;
	}

	public get light(): LightBase {
		return this._light;
	}

	public set light(value: LightBase) {
		if (this._light == value)
			return;

		this._light = value;
	}

	/**
     * A small value to counter floating point precision errors when comparing values in the shadow map with the
     * calculated depth value. Increase this if shadow banding occurs, decrease it if the shadow seems to be too detached.
     */
	public get epsilon(): number {
		return this._epsilon;
	}

	public set epsilon(value: number) {
		this._epsilon = value;
	}

	public get size(): number {
		return this._size;
	}

	public set size(value: number) {
    	if (this._size == value)
    		return;

		this._size = value;

		this._updateSize();
	}

	public update(partition: PartitionBase, renderGroup: RenderGroup): void {
		this._updateProjection(renderGroup.view.projection);

		this._renderMap(partition, renderGroup);
	}

	protected _updateProjection(projection: ProjectionBase): void {
		throw new AbstractMethodError();
	}

	protected _renderMap(partition: PartitionBase, renderGroup: RenderGroup): void {
		throw new AbstractMethodError();
	}

	protected _updateSize() {
		throw new AbstractMethodError();
	}

	public dispose(): void {
		this._light = null;
	}
}

import { AssetEvent } from '@awayjs/core';

import { ShaderRegisterCache, ShaderRegisterData, ShaderRegisterElement } from '@awayjs/stage';

import { _Render_RenderableBase, ShaderBase, _Shader_TextureBase, ChunkVO } from '@awayjs/renderer';

/**
 * _Shader_ShadowMapperBase provides an abstract method for simple (non-wrapping) shadow map methods.
 */
export class _Shader_ShadowMapperBase extends _Shader_MethodBase {
	private _fragmentAlphaIndex: number;

	protected _depthMapCoordReg: ShaderRegisterElement;

	protected _mapper: ShadowMapperBase;
	protected _shader: ShaderBase;

	protected _texture: _Shader_TextureBase;

	public autoUpdate: boolean = true;

	/**
     * @inheritDoc
     */
	public _cleanCompilationData(): void {
		super._cleanCompilationData();

		this._depthMapCoordReg = null;
	}

	public get texture(): _Shader_TextureBase {
		return this._texture;
	}

	/**
     * Wrappers that override the vertex shader need to set this explicitly
     */
	public get depthMapCoordReg(): ShaderRegisterElement {
		return this._depthMapCoordReg;
	}

	/**
     * Creates a new _Shader_ShadowMapperBase object.
     */
	constructor(mapper: ShadowMapperBase, shader: ShaderBase) {
		super(mapper, shader);

		this._mapper = mapper;
		this._shader = shader;

		this._shader.renderMaterial.renderGroup._addMapper(this._mapper);
	}

	/**
     *
     */
	public onClear(event: AssetEvent): void {
		super.onClear(event);

		this._shader.renderMaterial.renderGroup._removeMapper(this._mapper);
	}

	/**
     * @inheritDoc
     */
	public _initVO(chunkVO: ChunkVO): void {
		this._texture = <_Shader_TextureBase> this._mapper.textureMap.getAbstraction(this._shader, ShaderBase.abstractionClassPool[this._mapper.textureMap.assetType]);

		this._texture._initVO(chunkVO);
	}

	public _initConstants(): void {
		this._texture._initConstants();
	}

	/**
     * @inheritDoc
     */
	public _getFragmentCode(targetReg: ShaderRegisterElement, regCache: ShaderRegisterCache, sharedRegs: ShaderRegisterData): string {
		const dataReg: ShaderRegisterElement = regCache.getFreeFragmentConstant();
		this._fragmentAlphaIndex = dataReg.index * 4;

		return 'add ' + targetReg + '.w, ' + targetReg + '.w, ' + dataReg + '.x\n' + // add alpha
            'sat ' + targetReg + '.w, ' + targetReg + '.w\n';
	}

	/**
     * @inheritDoc
     */
	public _activate(): void {
		const fragmentData: Float32Array = this._shader.fragmentConstantData;
		const index: number = this._fragmentAlphaIndex;

		fragmentData[index] = 1 - this._mapper.alpha;

		this._texture.activate();
	}

	/**
     * @inheritDoc
     */
	public _setRenderState(renderState: _Render_RenderableBase): void {
		this._texture._setRenderState(renderState);
	}
}