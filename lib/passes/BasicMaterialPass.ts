import { AssetEvent } from '@awayjs/core';

import { ShaderRegisterCache, ShaderRegisterData, ShaderRegisterElement } from '@awayjs/stage';

import { View } from '@awayjs/view';

import { _Render_RenderableBase, _Render_MaterialBase, _Render_ElementsBase, ShaderBase, _Shader_TextureBase } from '@awayjs/renderer';

import { MaterialBase } from '../MaterialBase';

import { PassBase } from './PassBase';
import { TextureBase } from '../textures/TextureBase';

/**
 * BasicMaterialPass forms an abstract base class for the default shaded materials provided by Stage,
 * using material methods to define their appearance.
 */
export class BasicMaterialPass extends PassBase {
	private _shaderTexture: _Shader_TextureBase;
	private _diffuseR: number = 1;
	private _diffuseG: number = 1;
	private _diffuseB: number = 1;
	private _diffuseA: number = 1;

	private _fragmentConstantsIndex: number;

	constructor(renderMaterial: _Render_MaterialBase, renderElements: _Render_ElementsBase) {
		super(renderMaterial, renderElements);

		this._shader = new ShaderBase(renderElements, renderMaterial, this, this._stage);

		this.invalidate();
	}

	public _includeDependencies(shader: ShaderBase): void {
		super._includeDependencies(shader);

		if (this._shaderTexture != null)
			shader.uvDependencies++;
	}

	public invalidate(): void {
		super.invalidate();
		let texture: TextureBase = (<MaterialBase> this._renderMaterial.material).getTextureAt(0);
		this._shaderTexture = texture ? <_Shader_TextureBase> texture.getAbstraction(this._shader, ShaderBase.abstractionClassPool[texture.assetType]) : null;
	}

	public dispose(): void {
		if (this._shaderTexture) {
			this._shaderTexture.onClear(new AssetEvent(AssetEvent.CLEAR, (<MaterialBase> this._renderMaterial.material).getTextureAt(0)));
			this._shaderTexture = null;
		}

		super.dispose();
	}

	/**
	 * @inheritDoc
	 */
	public _getFragmentCode(regCache: ShaderRegisterCache, sharedReg: ShaderRegisterData): string {
		let code: string = '';

		let alphaReg: ShaderRegisterElement;

		if (this.preserveAlpha) {
			alphaReg = regCache.getFreeFragmentSingleTemp();
			regCache.addFragmentTempUsages(alphaReg, 1);
			code += 'mov ' + alphaReg + ', ' + sharedReg.shadedTarget + '.w\n';
		}

		const targetReg: ShaderRegisterElement = sharedReg.shadedTarget;

		if (this._shaderTexture != null) {

			code += this._shaderTexture._getFragmentCode(targetReg, regCache, sharedReg, sharedReg.uvVarying);

			if (this._shader.alphaThreshold > 0) {
				const cutOffReg: ShaderRegisterElement = regCache.getFreeFragmentConstant();
				this._fragmentConstantsIndex = cutOffReg.index * 4;

				code += 'sub ' + targetReg + '.w, ' + targetReg + '.w, ' + cutOffReg + '.x\n' + 'kil ' + targetReg + '.w\n' + 'add ' + targetReg + '.w, ' + targetReg + '.w, ' + cutOffReg + '.x\n';
			}
		} else if (this._shader.colorBufferIndex != -1) {

			code += 'mov ' + targetReg + ', ' + sharedReg.colorVarying + '\n';
		} else {
			const diffuseInputReg: ShaderRegisterElement = regCache.getFreeFragmentConstant();

			this._fragmentConstantsIndex = diffuseInputReg.index * 4;

			code += 'mov ' + targetReg + ', ' + diffuseInputReg + '\n';
		}

		if (this.preserveAlpha) {
			code += 'mul ' + sharedReg.shadedTarget + '.w, ' + sharedReg.shadedTarget + '.w, ' + alphaReg + '\n';
			regCache.removeFragmentTempUsage(alphaReg);
		}

		return code;
	}

	public _setRenderState(renderState: _Render_RenderableBase): void {
		super._setRenderState(renderState);

		if (this._shaderTexture != null)
			this._shaderTexture._setRenderState(renderState);
	}

	/**
	 * @inheritDoc
	 */
	public _activate(): void {
		super._activate();

		if (this._shaderTexture != null) {
			this._shaderTexture.activate();

			if (this._shader.alphaThreshold > 0)
				this._shader.fragmentConstantData[this._fragmentConstantsIndex] = this._shader.alphaThreshold;
		} else if (this._shader.colorBufferIndex == -1) {
			const index: number = this._fragmentConstantsIndex;
			const data: Float32Array = this._shader.fragmentConstantData;
			data[index] = this._diffuseR;
			data[index + 1] = this._diffuseG;
			data[index + 2] = this._diffuseB;
			data[index + 3] = this._diffuseA;
		}
	}
}