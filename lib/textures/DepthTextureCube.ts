﻿import { ImageCube } from '@awayjs/stage';

import { ImageTextureCube } from '@awayjs/renderer';

export class DepthTextureCube extends ImageTextureCube {
	public static assetType: string = '[texture DepthTextureCube]';

	/**
	 *
	 * @returns {string}
	 */
	public get assetType(): string {
		return DepthTextureCube.assetType;
	}

	constructor(image: ImageCube = null) {
		super(image);
	}
}

import { ShaderRegisterCache, ShaderRegisterData, ShaderRegisterElement } from '@awayjs/stage';

import { ShaderBase, ChunkVO, _Shader_ImageTexture } from '@awayjs/renderer';

/**
 *
 * @class away.pool._Shader_ImageTexture2D
 */
export class _Shader_DepthTexture extends _Shader_ImageTexture {
	private _decodeReg: ShaderRegisterElement;

	private _decodeIndex: number;

	public _initVO(chunkVO: ChunkVO): void {
		this._decodeReg = null;
		this._decodeIndex = -1;
	}

	/**
     *
     *
     * @internal
     */
	public _initConstants(): void {
		const fragmentData: Float32Array = this._shader.fragmentConstantData;
		const index: number = this._decodeIndex;
		fragmentData[index] = 1.0;
		fragmentData[index + 1] = 1 / 255.0;
		fragmentData[index + 2] = 1 / 65025.0;
		fragmentData[index + 3] = 1 / 16581375.0;
	}

	/**
     * @inheritDoc
     */
	public _getFragmentCode(targetReg: ShaderRegisterElement, regCache: ShaderRegisterCache, sharedReg: ShaderRegisterData, inputReg: ShaderRegisterElement): string {
		if (this._decodeIndex == -1)
			this._decodeIndex = (this._decodeReg = regCache.getFreeFragmentConstant()).index * 4;

		const temp: ShaderRegisterElement = regCache.getFreeFragmentVectorTemp();

		return super._getFragmentCode(temp, regCache, sharedReg, inputReg) +
            'dp4 ' + targetReg + '.w, ' + temp + ', ' + this._decodeReg + '\n';
	}
}

ShaderBase.registerAbstraction(_Shader_DepthTexture, DepthTextureCube);