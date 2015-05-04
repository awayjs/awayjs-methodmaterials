import LightingShader					= require("awayjs-renderergl/lib/shaders/LightingShader");
import ShaderRegisterCache				= require("awayjs-renderergl/lib/shaders/ShaderRegisterCache");
import ShaderRegisterData				= require("awayjs-renderergl/lib/shaders/ShaderRegisterData");
import ShaderRegisterElement			= require("awayjs-renderergl/lib/shaders/ShaderRegisterElement");

import MethodVO							= require("awayjs-methodmaterials/lib/data/MethodVO");
import SpecularBasicMethod				= require("awayjs-methodmaterials/lib/methods/SpecularBasicMethod");

/**
 * SpecularAnisotropicMethod provides a specular method resulting in anisotropic highlights. These are typical for
 * surfaces with microfacet details such as tiny grooves. In particular, this uses the Heidrich-Seidel distrubution.
 * The tangent vectors are used as the surface groove directions.
 */
class SpecularAnisotropicMethod extends SpecularBasicMethod
{
	/**
	 * Creates a new SpecularAnisotropicMethod object.
	 */
	constructor()
	{
		super();
	}

	/**
	 * @inheritDoc
	 */
	public iInitVO(shader:LightingShader, methodVO:MethodVO)
	{
		methodVO.needsTangents = true;
		methodVO.needsView = true;
	}

	/**
	 * @inheritDoc
	 */
	public iGetFragmentCodePerLight(shader:LightingShader, methodVO:MethodVO, lightDirReg:ShaderRegisterElement, lightColReg:ShaderRegisterElement, registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
	{
		var code:string = "";
		var t:ShaderRegisterElement;

		if (this._pIsFirstLight)
			t = this._pTotalLightColorReg;
		else {
			t = registerCache.getFreeFragmentVectorTemp();
			registerCache.addFragmentTempUsages(t, 1);
		}

		// (sin(l,t) * sin(v,t) - cos(l,t)*cos(v,t)) ^ k

		code += "nrm " + t + ".xyz, " + sharedRegisters.tangentVarying + ".xyz\n" +
			"dp3 " + t + ".w, " + t + ".xyz, " + lightDirReg + ".xyz\n" +
			"dp3 " + t + ".z, " + t + ".xyz, " + sharedRegisters.viewDirFragment + ".xyz\n";

		// (sin(t.w) * sin(t.z) - cos(t.w)*cos(t.z)) ^ k
		code += "sin " + t + ".x, " + t + ".w\n" +
			"sin " + t + ".y, " + t + ".z\n" +
			// (t.x * t.y - cos(t.w)*cos(t.z)) ^ k
			"mul " + t + ".x, " + t + ".x, " + t + ".y\n" +
			// (t.x - cos(t.w)*cos(t.z)) ^ k
			"cos " + t + ".z, " + t + ".z\n" +
			"cos " + t + ".w, " + t + ".w\n" +
			// (t.x - t.w*t.z) ^ k
			"mul " + t + ".w, " + t + ".w, " + t + ".z\n" +
			// (t.x - t.w) ^ k
			"sub " + t + ".w, " + t + ".x, " + t + ".w\n";

		if (this.texture) {
			// apply gloss modulation from texture
			code += "mul " + this._pSpecularTexData + ".w, " + this._pSpecularTexData + ".y, " + this._pSpecularDataRegister + ".w\n" +
				"pow " + t + ".w, " + t + ".w, " + this._pSpecularTexData + ".w\n";
		} else
			code += "pow " + t + ".w, " + t + ".w, " + this._pSpecularDataRegister + ".w\n";

		// attenuate
		code += "mul " + t + ".w, " + t + ".w, " + lightDirReg + ".w\n";

		if (this._iModulateMethod != null)
			code += this._iModulateMethod(shader, methodVO, t, registerCache, sharedRegisters);

		code += "mul " + t + ".xyz, " + lightColReg + ".xyz, " + t + ".w\n";

		if (!this._pIsFirstLight) {
			code += "add " + this._pTotalLightColorReg + ".xyz, " + this._pTotalLightColorReg + ".xyz, " + t + ".xyz\n";
			registerCache.removeFragmentTempUsage(t);
		}

		this._pIsFirstLight = false;

		return code;
	}
}

export = SpecularAnisotropicMethod;