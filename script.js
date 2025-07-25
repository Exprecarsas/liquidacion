        document.getElementById('camposCalzado').classList.toggle('hidden', tipo !== 'calzado');
        document.getElementById('camposNormal').classList.toggle('hidden', tipo !== 'normal');
        pesoTotalInput.disabled = tipo === 'calzado';
        calcularVolumetricoBtn.classList.toggle('hidden', tipo === 'calzado');
    };

    ciudadDestino.addEventListener('input', function () {
        const val = this.value.toLowerCase();
        suggestionsBox.innerHTML = '';
        ciudades.filter(c => c.toLowerCase().startsWith(val)).forEach(city => {
            const p = document.createElement('p');
            p.textContent = city;
            p.onclick = () => {
                ciudadDestino.value = city;
                suggestionsBox.innerHTML = '';
                ciudadDestino.dispatchEvent(new Event('change'));
                validarCampo(ciudadDestino, ciudadValida(ciudadDestino.value), 'Ciudad no encontrada. Revise la escritura o contacte a Sistemas: Yerson 3212728425');
            };
            suggestionsBox.appendChild(p);
        });
    });

    ciudadDestino.addEventListener('blur', () => validarCampo(ciudadDestino, ciudadValida(ciudadDestino.value), 'Ciudad no encontrada. Contacto: Yerson 3212728425'));
    valorDeclaradoInput.addEventListener('blur', validarValorDeclarado);
    pesoTotalInput.addEventListener('input', () => {
        if (!pesoTotalInput.disabled) validarCampo(pesoTotalInput, parseFloat(pesoTotalInput.value) > 0, 'Peso inválido');
    });
    numUnidadesInput.addEventListener('input', () => validarCampo(numUnidadesInput, parseInt(numUnidadesInput.value) > 0, 'Debe ingresar al menos una unidad'));

    document.getElementById('calcularBtn').addEventListener('click', function () {
        const ciudad = ciudadDestino.value.trim().toUpperCase();
        const tipo = tipoCajaSelect.value;
        const unidades = parseInt(numUnidadesInput.value);
        const peso = parseFloat(pesoTotalInput.value);
        const valor = parseFloat(valorDeclaradoInput.value.replace(/\./g, '').replace(/\D/g, '')) || 0;
        const nombreUsuario = localStorage.getItem('nombreUsuario') || 'Anónimo';

        unidades30 = parseInt(document.getElementById('calzado_30_60')?.value) || 0;
        unidades60 = parseInt(document.getElementById('calzado_60_90')?.value) || 0;
        unidades90 = parseInt(document.getElementById('calzado_90_120')?.value) || 0;

        const validaciones = [
            validarCampo(ciudadDestino, ciudadValida(ciudadDestino.value), 'Ciudad no encontrada. Contacto: Yerson 3212728425'),
            tipo === 'normal' ? validarCampo(numUnidadesInput, unidades > 0, 'Unidades requeridas') : true,
            tipo === 'normal' ? validarCampo(pesoTotalInput, peso > 0, 'Peso requerido') : true,
            tipo === 'calzado' ? (unidades30 + unidades60 + unidades90 > 0) : true,
            validarValorDeclarado()
        ];

        if (validaciones.includes(false)) {
            return mostrarError('⚠️ Completa todos los campos correctamente.');
        }

        let ciudadNormalizada = normalizarTexto(ciudad);
        if (tipo === 'calzado') {
            ciudadNormalizada = 'CALZ_' + ciudadNormalizada;
        } else {
            ciudadNormalizada = 'NORM_' + ciudadNormalizada;
        }

        let origen = localStorage.getItem('origenUsuario') || '';
        let origenNormalizado = normalizarTexto(origen);
        if (origen) {
            origenNormalizado = 'NORM_' + origenNormalizado;
        }

        let costoCaja = 0, costoSeguro = 0, kilosAdicionales = 0;

        if (tipo === "normal") {
            costoSeguro = valor <= 1000000 ? valor * 0.01 : valor * 0.005;
            const tarifaCiudad = tarifas.normal?.[ciudadNormalizada];
            if (!tarifaCiudad || !tarifaCiudad[origenNormalizado]) {
                return mostrarError('Ciudad sin tarifa. Contacto: Javier 3002099331 Para confirma tarifa');
            }

            const tarifa = tarifaCiudad[origenNormalizado];
            costoCaja = tarifa * unidades;
            const pesoMinimo = unidades * 30;
            if (peso > pesoMinimo) {
                kilosAdicionales = (peso - pesoMinimo) * (tarifa / 30);
            }
        } else if (tipo === "calzado") {
            costoSeguro = valor * (ciudadesCalzadoSeguro1Porciento.includes(ciudad) ? 0.01 : 0.005);
            const tarifasCiudad = tarifas.calzado?.[ciudadNormalizada] || {};
            costoCaja =
                (tarifasCiudad["30-60 KG"] || 0) * unidades30 +
                (tarifasCiudad["60-90 KG"] || 0) * unidades60 +
                (tarifasCiudad["90-120 KG"] || 0) * unidades90;
        }

        const costoTotal = Math.floor(costoCaja + kilosAdicionales + costoSeguro);
        const origenFinal = localStorage.getItem('origenUsuario')?.toUpperCase() || 'NO DEFINIDO';

        resultadoContenido.innerHTML = `
            <div class="resultado-box">
                <h3><i class="fas fa-receipt"></i> Resultados de la Liquidación</h3>
                <p><i class="fas fa-box"></i> <strong>Tipo de Caja:</strong> ${tipo}</p>
                <p><i class="fas fa-map-marker-alt"></i> <strong>Origen:</strong> ${origenFinal}</p>
                <p><i class="fas fa-map-marker-alt"></i> <strong>Ciudad de Destino:</strong> ${ciudad}</p>
                ${tipo === 'normal' ? `<p><i class="fas fa-weight-hanging"></i> <strong>Peso Total:</strong> ${peso} kg</p>` : `
                <div class="rangos">
                    <p><strong>Rangos Usados:</strong></p>
                    <ul>
                        ${unidades30 ? `<li>🟩 ${unidades30} unidad(es) 30-60 KG</li>` : ''}
                        ${unidades60 ? `<li>🟨 ${unidades60} unidad(es) 60-90 KG</li>` : ''}
                        ${unidades90 ? `<li>🟥 ${unidades90} unidad(es) 90-120 KG</li>` : ''}
                    </ul>
                </div>`}
                <hr>
                <p><i class="fas fa-truck"></i> <strong>Costo Envío:</strong> <span class="precio">$${Math.trunc(costoCaja).toLocaleString('es-CO')}</span></p>
                ${kilosAdicionales ? `<p><i class="fas fa-balance-scale"></i><strong>Kilos Adicionales:</strong><span class="precio"> $${Math.trunc(kilosAdicionales).toLocaleString('es-CO')}</p>` : ''}
                <p><i class="fas fa-shield-alt"></i><strong>Costo Seguro:</strong><span class="seguro"> $${Math.trunc(costoSeguro).toLocaleString('es-CO')}</p>
                <p><i class="fas fa-coins"></i><strong>Total a Pagar:</strong> <span class="total">$${Math.trunc(costoTotal).toLocaleString('es-CO')}</span></p>
            </div>`;
        resultadoModal.style.display = 'block';

        registrarEvento(
            nombreUsuario,
            localStorage.getItem('origenUsuario') || 'SIN ORIGEN',
            ciudad,
            tipo,
            peso || '',
            tipo === "normal" ? unidades : unidades30 + unidades60 + unidades90,
            valor,
            Math.trunc(costoCaja),
            Math.trunc(costoSeguro),
            Math.trunc(kilosAdicionales),
            Math.trunc(costoTotal)
        );
        guardarEnLocalStorage();
    });

    limpiarBtn.addEventListener('click', () => {
        // 1. Limpia el formulario sin recargar
        localStorage.removeItem('datosFormulario');

        // 2. Resetea los campos visuales
        ciudadDestino.value = '';
        tipoCajaSelect.value = 'normal';
        tipoCajaSelect.dispatchEvent(new Event('change')); // actualiza visibilidad
        pesoTotalInput.value = '';
        altoInput.value = '';
        anchoInput.value = '';
        largoInput.value = '';
        valorDeclaradoInput.value = '';
        numUnidadesInput.value = '';
        document.getElementById('calzado_30_60') && (document.getElementById('calzado_30_60').value = 0);
        document.getElementById('calzado_60_90') && (document.getElementById('calzado_60_90').value = 0);
        document.getElementById('calzado_90_120') && (document.getElementById('calzado_90_120').value = 0);

        // 3. Limpia sugerencias y errores
        suggestionsBox.innerHTML = '';
        document.querySelectorAll('.error-msg').forEach(e => e.textContent = '');
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/liquidacion/sw.js').catch(console.error);
        });
    }
});