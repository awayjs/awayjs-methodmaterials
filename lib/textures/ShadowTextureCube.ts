﻿import { ImageCube } from '@awayjs/stage';

import { PointLight } from '../lights/PointLight';
import { ShadowMapperBase } from '../mappers/ShadowMapperBase';

import { ImageTextureCube } from '@awayjs/renderer';

export class ShadowTextureCube extends ImageTextureCube {
	public static assetType: string = '[texture ShadowTextureCube]';

	private _mapper: ShadowMapperBase
	/**
	 *
	 * @returns {string}
	 */
	public get assetType(): string {
		return ShadowTextureCube.assetType;
	}

	public get mapper(): ShadowMapperBase {
		return this._mapper;
	}

	constructor(mapper: ShadowMapperBase, image: ImageCube = null) {
		super(image);

		this._mapper = mapper;
	}
}

import { Vector3D } from '@awayjs/core';

import { ShaderRegisterCache, ShaderRegisterData, ShaderRegisterElement } from '@awayjs/stage';

import { ShaderBase } from '@awayjs/renderer';

import { _Shader_DepthTexture } from './DepthTextureCube';

/**
 *
 * @class away.pool._Shader_DepthTexture
 */
export class _Shader_ShadowTextureCube extends _Shader_DepthTexture {
	private _positionIndex: number;

	/**
     * @inheritDoc
     */
	public _getFragmentCode(targetReg: ShaderRegisterElement, regCache: ShaderRegisterCache, sharedRegisters: ShaderRegisterData, inputReg: ShaderRegisterElement): string {
		const posReg: ShaderRegisterElement = regCache.getFreeFragmentConstant();
		this._positionIndex = posReg.index * 4;

		const epsReg: ShaderRegisterElement = regCache.getFreeFragmentConstant();

		let code: string = '';

		const lightDir: ShaderRegisterElement = regCache.getFreeFragmentVectorTemp();

		code += 'sub ' + lightDir + ', ' + inputReg + ', ' + posReg + '\n' +
            'dp3 ' + lightDir + '.w, ' + lightDir + '.xyz, ' + lightDir + '.xyz\n' +
            'nrm ' + lightDir + '.xyz, ' + lightDir + '.xyz\n';

		code += super._getFragmentCode(targetReg, regCache, sharedRegisters, lightDir) +
            'add ' + lightDir + '.w, ' + lightDir + '.w, ' + epsReg + '.x\n' +    // offset by epsilon (add 2*light*epsilon)?
            'mul ' + lightDir + '.w, ' + lightDir + '.w, ' + posReg + '.w\n' + // divide by falloff squared to normalise
            'slt ' + targetReg + '.w, ' + lightDir + '.w, ' + targetReg + '.w\n'; // 0 if in shadow

		return code;
	}

	/**
     * @inheritDoc
     */
	public _activate(): void {
		super.activate();

		const fragmentData: Float32Array = this._shader.fragmentConstantData;
		const index: number = this._positionIndex;

		const pos: Vector3D = (<ShadowTextureCube> this._texture).mapper.light.transform.matrix3D.position;
		const fallOff: number = (<PointLight> (<ShadowTextureCube> this._texture).mapper.light).fallOff; // used to decompress distance

		fragmentData[index] = pos.x;
		fragmentData[index + 1] = pos.y;
		fragmentData[index + 2] = pos.z;
		fragmentData[index + 3] = 1 / (2 * fallOff * fallOff); //TODO: do we need the 2?

		//epsilon
		fragmentData[index + 4] = -Math.pow(1 / (fallOff * (<ShadowTextureCube> this._texture).mapper.epsilon), 2);
	}
}

ShaderBase.registerAbstraction(_Shader_ShadowTextureCube, ShadowTextureCube);