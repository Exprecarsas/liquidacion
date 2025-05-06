document.addEventListener('DOMContentLoaded', function () {
    const ciudadDestino = document.getElementById('ciudadDestino');
    const suggestionsBox = document.getElementById('suggestions');
    const tipoCajaSelect = document.getElementById('tipoCaja');
    const pesoTotalInput = document.getElementById('pesoTotal');
    const calcularVolumetricoBtn = document.getElementById('calcularVolumetricoBtn');
    const volumetricModal = document.getElementById('volumetricModal');
    const aceptarVolumetrico = document.getElementById('aceptarVolumetrico');
    const altoInput = document.getElementById('alto');
    const anchoInput = document.getElementById('ancho');
    const largoInput = document.getElementById('largo');
    const valorDeclaradoInput = document.getElementById('valorDeclarado');
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const resultadoModal = document.getElementById('resultadoModal');
    const resultadoContenido = document.getElementById('resultadoContenido');
    const closeErrorBtn = document.querySelector('.close-btn');
    const closeVolumetricBtn = document.querySelector('.close-volumetric-btn');
    const closeResultadoBtn = document.querySelector('.close-modal-btn');
    const numUnidadesInput = document.getElementById('numUnidades');
    const limpiarBtn = document.getElementById('limpiarBtn');

    let tarifas = {}, ciudades = [], pesoVolumetricoCalculado = 0;
    let unidades30 = 0, unidades60 = 0, unidades90 = 0;

    const ciudadesCalzadoSeguro1Porciento = ["POPAYAN", "PASTO", "NEIVA", "VILLAVICENCIO", "TUNJA", "TUMACO", "MOCOA", "GARZON", "FLORENCIA", "BUENAVENTURA", "NEPOCLI", "APARTADO", "CAUCACIA", "YOPAL", "DUITAMA", "MITU", "YARUMAL", "TARAZA", "PLANETA RICA", "SAN MARCO", "LORICA", "PLATO", "EL CARMEN DE BOLIVAR", "ARMOBELETES", "TIERRA ALTA", "CHINU"];

    fetch('https://script.google.com/macros/s/AKfycbzWt6zYnozze630yVncH_j11Zjhdo9yD3t1JIxToqZ486QWs9D6Uxx5H6B4wz1KlmY/exec')
        .then(r => r.json())
        .then(data => {
            tarifas = data;
            if (localStorage.getItem('datosFormulario')) restaurarFormulario();
        })
        .catch(() => mostrarError('Error al cargar tarifas. Intenta más tarde.'));

    function mostrarError(mensaje) {
        errorMessage.textContent = mensaje;
        errorModal.style.display = "block";
    }

    closeErrorBtn.onclick = () => errorModal.style.display = "none";
    closeVolumetricBtn.onclick = () => volumetricModal.style.display = 'none';
    closeResultadoBtn.onclick = () => resultadoModal.style.display = 'none';
    calcularVolumetricoBtn.onclick = () => volumetricModal.style.display = 'block';

    [altoInput, anchoInput, largoInput].forEach(i => i.addEventListener('input', () => {
        pesoVolumetricoCalculado = (parseFloat(altoInput.value) || 0) * (parseFloat(anchoInput.value) || 0) * (parseFloat(largoInput.value) || 0) / 2500;
    }));

    aceptarVolumetrico.onclick = () => {
        if (pesoVolumetricoCalculado > 0) {
            pesoTotalInput.value = pesoVolumetricoCalculado.toFixed(2);
            volumetricModal.style.display = 'none';
        } else {
            mostrarError('Debe ingresar dimensiones válidas.');
        }
    };

    valorDeclaradoInput.oninput = () => {
        let valor = valorDeclaradoInput.value.replace(/\D/g, '');
        valorDeclaradoInput.value = new Intl.NumberFormat('de-DE').format(valor);
    };

    tipoCajaSelect.onchange = () => {
        const tipo = tipoCajaSelect.value;
        actualizarCiudades(tipo);
        document.getElementById('camposCalzado').classList.toggle('hidden', tipo !== 'calzado');
        document.getElementById('camposNormal').classList.toggle('hidden', tipo !== 'normal');
        pesoTotalInput.disabled = tipo === 'calzado';
        calcularVolumetricoBtn.classList.toggle('hidden', tipo === 'calzado');
    };

    function actualizarCiudades(tipoCaja) {
        ciudades = Object.keys(tarifas[tipoCaja] || {});
        pesoTotalInput.value = '';
        ciudadDestino.value = '';
        suggestionsBox.innerHTML = '';
    }

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
                // 🔁 Validación inmediata después de selección
                validarCampo(ciudadDestino, ciudadValida(ciudadDestino.value), 'Ciudad inválida');
            };
            suggestionsBox.appendChild(p);
        });
    });

    function ciudadValida(ciudadIngresada) {
        if (!ciudadIngresada.trim()) return false;
        const normalizada = ciudadIngresada.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '');
        return ciudades.some(c => {
            const cNormalizada = c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '');
            return cNormalizada === normalizada;
        });
    }

    function validarCampo(input, condicion, mensaje) {
        let error = input.nextElementSibling;
        if (!error || !error.classList.contains("error-msg")) {
            error = document.createElement("div");
            error.className = "error-msg";
            input.parentNode.insertBefore(error, input.nextSibling);
        }
        const icon = input.closest('.input-icon-wrapper')?.querySelector('.estado-icono');
        if (icon) {
            icon.textContent = condicion ? '✔' : '❌';
            icon.style.color = condicion ? 'green' : 'red';
        }
        error.textContent = condicion ? '' : mensaje;
        return condicion;
    }

    function validarValorDeclarado() {
        const tipo = tipoCajaSelect.value;
        const ciudad = ciudadDestino.value.trim().toUpperCase();
        const valor = parseFloat(valorDeclaradoInput.value.replace(/\./g, '').replace(/\D/g, '')) || 0;
        const minimo = tipo === "calzado" && ciudadesCalzadoSeguro1Porciento.includes(ciudad) ? 1000000 : 500000;
        return validarCampo(valorDeclaradoInput, valor >= minimo, `Mínimo $${minimo.toLocaleString('es-CO')}`);
    }

    ciudadDestino.addEventListener('blur', () => validarCampo(ciudadDestino, ciudadValida(ciudadDestino.value), 'Ciudad inválida'));
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
    
        // Extraer valores de calzado incluso si no se van a usar
        unidades30 = parseInt(document.getElementById('calzado_30_60').value) || 0;
        unidades60 = parseInt(document.getElementById('calzado_60_90').value) || 0;
        unidades90 = parseInt(document.getElementById('calzado_90_120').value) || 0;
    
        // Validaciones separadas según tipo de caja
        const validaciones = [
            validarCampo(ciudadDestino, ciudadValida(ciudad), 'Ciudad inválida'),
            tipo === 'normal' ? validarCampo(numUnidadesInput, unidades > 0, 'Unidades requeridas') : true,
            tipo === 'normal' ? validarCampo(pesoTotalInput, peso > 0, 'Peso requerido') : true,
            tipo === 'calzado' ? (unidades30 + unidades60 + unidades90 > 0) : true,
            validarValorDeclarado()
        ];
    
        if (validaciones.includes(false)) {
            return mostrarError('⚠️ Completa todos los campos correctamente.');
        }
    
        let costoCaja = 0, costoSeguro = 0, kilosAdicionales = 0;
    
        if (tipo === "normal") {
            costoSeguro = valor <= 1000000 ? valor * 0.01 : valor * 0.005;
            const tarifa = tarifas.normal?.[ciudad];
            if (!tarifa) return mostrarError('Ciudad no encontrada.');
            costoCaja = tarifa * unidades;
            const pesoMinimo = unidades * 30;
            if (peso > pesoMinimo) {
                kilosAdicionales = (peso - pesoMinimo) * (tarifa / 30);
            }
        } else if (tipo === "calzado") {
            costoSeguro = valor * (ciudadesCalzadoSeguro1Porciento.includes(ciudad) ? 0.01 : 0.005);
            const tarifasCiudad = tarifas.calzado?.[ciudad] || {};
            costoCaja =
                (tarifasCiudad["30-60 KG"] || 0) * unidades30 +
                (tarifasCiudad["60-90 KG"] || 0) * unidades60 +
                (tarifasCiudad["90-120 KG"] || 0) * unidades90;
        }
    
        let costoTotal = Math.floor(costoCaja + kilosAdicionales + costoSeguro);
        
        resultadoContenido.innerHTML = `
            <div class="resultado-box">
                <h3><i class="fas fa-receipt"></i> Resultados de la Liquidación</h3>
                <p><i class="fas fa-box"></i> <strong>Tipo de Caja:</strong> ${tipo}</p>
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
        guardarEnLocalStorage();
    });

    function guardarEnLocalStorage() {
        const datos = {
            ciudadDestino: ciudadDestino.value,
            tipoCaja: tipoCajaSelect.value,
            pesoTotal: pesoTotalInput.value,
            alto: altoInput.value,
            ancho: anchoInput.value,
            largo: largoInput.value,
            valorDeclarado: valorDeclaradoInput.value,        
            numUnidades: numUnidadesInput.value,
            unidades30: document.getElementById('calzado_30_60')?.value || '0',
            unidades60: document.getElementById('calzado_60_90')?.value || '0',
            unidades90: document.getElementById('calzado_90_120')?.value || '0'
        };
        localStorage.setItem('datosFormulario', JSON.stringify(datos));
    }

    function restaurarFormulario() {
        const datos = JSON.parse(localStorage.getItem('datosFormulario'));
        ciudadDestino.value = datos.ciudadDestino || '';
        tipoCajaSelect.value = datos.tipoCaja || 'normal';
        tipoCajaSelect.dispatchEvent(new Event('change'));
        pesoTotalInput.value = datos.pesoTotal || '';
        altoInput.value = datos.alto || '';
        anchoInput.value = datos.ancho || '';
        largoInput.value = datos.largo || '';
        valorDeclaradoInput.value = datos.valorDeclarado || '';                
        numUnidadesInput.value = datos.numUnidades || '';
        document.getElementById('calzado_30_60').value = datos.unidades30 || '0';
        document.getElementById('calzado_60_90').value = datos.unidades60 || '0';
        document.getElementById('calzado_90_120').value = datos.unidades90 || '0';
    }

    limpiarBtn.addEventListener('click', () => {
        localStorage.removeItem('datosFormulario');
        location.reload();
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/liquidacion/sw.js').catch(console.error);
        });
    }
});
