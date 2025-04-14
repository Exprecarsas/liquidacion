document.addEventListener('DOMContentLoaded', function () {
    const ciudadDestino = document.getElementById('ciudadDestino');
    const suggestionsBox = document.getElementById('suggestions');
    const tipoCajaSelect = document.getElementById('tipoCaja');
    const pesoTotalInput = document.getElementById('pesoTotal');
    const rangoPesoSelect = document.getElementById('rangoPeso');
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
    const descuentoInput = document.getElementById('descuento'); // Campo de descuento opcional
    const closeErrorBtn = document.querySelector('.close-btn'); // Botón de cierre para el modal de error
    const closeVolumetricBtn = document.querySelector('.close-volumetric-btn'); // Botón de cierre para el modal volumétrico
    const closeResultadoBtn = document.querySelector('.close-modal-btn'); // Botón de cierre para el modal de resultados

    let tarifas = {};
    let ciudades = [];
    let pesoVolumetricoCalculado = 0;

    // Lista de ciudades seguro mínimo de 1,000,000 y tasa del 1% solo para calzado
    const ciudadesCalzadoSeguro1Porciento = [
        "POPAYAN", "PASTO", "NEIVA", "VILLAVICENCIO", "TUNJA",
        "TUMACO", "MOCOA", "GARZON", "FLORENCIA", "BUENAVENTURA",
        "NEPOCLI", "APARTADO", "CAUCACIA", "YOPAL", "DUITAMA", "MITU",
        "YARUMAL", "TARAZA", "PLANETA RICA", "SAN MARCO", "LORICA",
        "PLATO", "EL CARMEN DE BOLIVAR", "ARMOBELETES", "TIERRA ALTA", "CHINU"
    ];

    fetch('https://script.google.com/macros/s/AKfycbzWt6zYnozze630yVncH_j11Zjhdo9yD3t1JIxToqZ486QWs9D6Uxx5H6B4wz1KlmY/exec')
        .then(response => response.json())
        .then(data => {
            tarifas = data;
            console.log("✅ Tarifas cargadas desde Google Sheets:", tarifas);
        })
        .catch(error => {
            console.error("❌ Error al cargar tarifas desde Google Sheets:", error);
            mostrarError('Error al cargar tarifas. Intenta más tarde.');
        });

    // Mostrar el modal con el mensaje de error
    function mostrarError(mensaje) {
        errorMessage.textContent = mensaje;
        errorModal.style.display = "block";
    }

    // Cerrar el modal de error al hacer clic en la 'X'
    closeErrorBtn.addEventListener('click', function () {
        errorModal.style.display = "none";
    });

    // Evento para abrir el modal de cálculo volumétrico
    calcularVolumetricoBtn.addEventListener('click', function () {
        volumetricModal.style.display = 'block';
    });

    // Cerrar la ventana modal de cálculo volumétrico al hacer clic en la 'X'
    closeVolumetricBtn.addEventListener('click', function () {
        volumetricModal.style.display = 'none';
    });

    // Calcular el peso volumétrico automáticamente al ingresar dimensiones
    function calcularPesoVolumetrico() {
        const alto = parseFloat(altoInput.value) || 0;
        const ancho = parseFloat(anchoInput.value) || 0;
        const largo = parseFloat(largoInput.value) || 0;

        if (alto > 0 && ancho > 0 && largo > 0) {
            pesoVolumetricoCalculado = (alto * ancho * largo) / 2500;
            console.log(`Peso volumétrico calculado: ${pesoVolumetricoCalculado.toFixed(2)} kg.`);
        } else {
            pesoVolumetricoCalculado = 0;
        }
    }

    altoInput.addEventListener('input', calcularPesoVolumetrico);
    anchoInput.addEventListener('input', calcularPesoVolumetrico);
    largoInput.addEventListener('input', calcularPesoVolumetrico);

    // Transferir el peso volumétrico al campo de peso total
    aceptarVolumetrico.addEventListener('click', function () {
        if (pesoVolumetricoCalculado > 0) {
            pesoTotalInput.value = pesoVolumetricoCalculado.toFixed(2);
            volumetricModal.style.display = 'none';
        } else {
            mostrarError('Debe ingresar dimensiones válidas para calcular el peso volumétrico.');
        }
    });

    // Formatear el valor declarado al escribir
    valorDeclaradoInput.addEventListener('input', function () {
        let valor = valorDeclaradoInput.value.replace(/\D/g, '');
        valorDeclaradoInput.value = new Intl.NumberFormat('de-DE').format(valor);
    });

    tipoCajaSelect.addEventListener('change', () => {
        const tipo = tipoCajaSelect.value;
        actualizarCiudades(tipo);

        if (tipo === 'calzado') {
            document.getElementById('camposCalzado').classList.remove('hidden');
            document.getElementById('camposNormal').classList.add('hidden');
            pesoTotalInput.disabled = true;
            calcularVolumetricoBtn.classList.add('hidden'); // 👈 esconder el botón
        } else if (tipo === 'normal') {
            document.getElementById('camposNormal').classList.remove('hidden');
            document.getElementById('camposCalzado').classList.add('hidden');
            pesoTotalInput.disabled = false;
            calcularVolumetricoBtn.classList.remove('hidden'); // 👈 mostrar el botón
        } else {
            document.getElementById('camposNormal').classList.add('hidden');
            document.getElementById('camposCalzado').classList.add('hidden');
        }
    });

    function actualizarCiudades(tipoCaja) {
        if (tipoCaja === "calzado") {
            ciudades = Object.keys(tarifas["calzado"] || {});
            console.log("📦 Ciudades calzado:", ciudades); // 👈 Agrega esto
            pesoTotalInput.disabled = true;
            pesoTotalInput.value = "";
        } else if (tipoCaja === "normal") {
            ciudades = Object.keys(tarifas["normal"] || {});
            console.log("📦 Ciudades normal:", ciudades); // 👈 Opcional
            pesoTotalInput.disabled = false;
        } else {
            ciudades = [];
        }
        ciudadDestino.value = '';
        suggestionsBox.innerHTML = '';
    }

    // Autocompletado de ciudad
    ciudadDestino.addEventListener('input', function () {
        const inputValue = this.value.toLowerCase();
        suggestionsBox.innerHTML = '';
        if (inputValue.length > 0) {
            const filteredCities = ciudades.filter(city => city.toLowerCase().startsWith(inputValue));
            filteredCities.forEach(city => {
                const suggestion = document.createElement('p');
                suggestion.textContent = city;
                suggestion.addEventListener('click', function () {
                    ciudadDestino.value = city;
                    suggestionsBox.innerHTML = '';
                    ciudadDestino.dispatchEvent(new Event('change'));
                });
                suggestionsBox.appendChild(suggestion);
            });
        }
    });

    // Cálculo del costo total (incluye seguro y kilos adicionales)
    document.getElementById('calcularBtn').addEventListener('click', function () {
        const tipoCaja = tipoCajaSelect.value;
        const numUnidades = parseInt(document.getElementById('numUnidades').value);
        const valorDeclaradoStr = valorDeclaradoInput.value.replace(/\./g, '');
        const valorDeclarado = parseFloat(valorDeclaradoStr);
        const ciudadDestinoValue = ciudadDestino.value.trim().toUpperCase();
        let pesoUsado = parseFloat(pesoTotalInput.value) || 0;
        let descuento = parseFloat(descuentoInput.value) || 0;

        // Se aplicará el descuento solo si se ingresa un valor entre 0 y 10
        if (descuento < 0 || descuento > 10) {
            mostrarError('El descuento debe estar entre 0 y 10 %.');
            return;
        }

        if (!tipoCaja || !ciudadDestinoValue || !ciudades.includes(ciudadDestinoValue)) {
            mostrarError('Seleccione un tipo de caja y una ciudad válida de destino.');
            return;
        }
        let costoCaja = 0;
        let costoSeguro = 0;
        let kilosAdicionales = 0;

        // Cálculo para cajas normales
        if (tipoCaja === "normal") {
            if (valorDeclarado < 500000) {
                mostrarError('El valor asegurado no puede ser menor a $500,000 para caja normal.');
                return;
            }
            costoSeguro = valorDeclarado <= 1000000 ? valorDeclarado * 0.01 : valorDeclarado * 0.005;

            if (tarifas["normal"] && tarifas["normal"][ciudadDestinoValue]) {
                costoCaja = tarifas["normal"][ciudadDestinoValue] * numUnidades; // Costo base para todas las unidades
                const pesoMinimoTotal = 30 * numUnidades; // Peso mínimo total basado en 30 kg por caja
                if (pesoUsado > pesoMinimoTotal) {
                    kilosAdicionales = (pesoUsado - pesoMinimoTotal) * (tarifas["normal"][ciudadDestinoValue] / 30); // Exceso total en kilos
                }
            } else {
                mostrarError(`No se encontraron tarifas para la ciudad seleccionada.`);
                return;
            }
        }
        // Cálculo para calzado
        else if (tipoCaja === "calzado") {
            if (ciudadesCalzadoSeguro1Porciento.includes(ciudadDestinoValue)) {
                if (valorDeclarado < 1000000) {
                    mostrarError('El valor asegurado no puede ser menor a $1,000,000 para esta ciudad.');
                    return;
                }
                costoSeguro = valorDeclarado * 0.01;
            } else {
                if (valorDeclarado < 500000) {
                    mostrarError('El valor asegurado no puede ser menor a $500,000 para caja de calzado.');
                    return;
                }
                costoSeguro = valorDeclarado * 0.005;
            }
            const unidades30 = parseInt(document.getElementById('calzado_30_60').value) || 0;
            const unidades60 = parseInt(document.getElementById('calzado_60_90').value) || 0;
            const unidades90 = parseInt(document.getElementById('calzado_90_120').value) || 0;

            const tarifasCiudad = tarifas["calzado"][ciudadDestinoValue];
            costoCaja =
                (tarifasCiudad["30-60 KG"] || 0) * unidades30 +
                (tarifasCiudad["60-90 KG"] || 0) * unidades60 +
                (tarifasCiudad["90-120 KG"] || 0) * unidades90;

        } else {
            mostrarError('Seleccione un rango de peso válido.');
            return;
        }


        // Ajustar los cálculos de costo total
        let costoTotal = Math.floor(costoCaja + kilosAdicionales + costoSeguro);

        // Si hay descuento, aplicarlo
        let descuentoAplicado = 0;
        if (descuento > 0) {
            descuentoAplicado = (costoTotal * descuento) / 100;
            costoTotal = costoTotal - descuentoAplicado;
        }

        let detallePeso = '';

        if (tipoCaja === 'normal') {
            detallePeso = `<p><strong>Peso Total:</strong> ${pesoUsado} kg</p>`;
        } else if (tipoCaja === 'calzado') {
            detallePeso = `<p><strong>Rangos Usados:</strong></p><ul>
                ${unidades30 > 0 ? `<li>${unidades30} unidad(es) de 30-60 KG</li>` : ''}
                ${unidades60 > 0 ? `<li>${unidades60} unidad(es) de 60-90 KG</li>` : ''}
                ${unidades90 > 0 ? `<li>${unidades90} unidad(es) de 90-120 KG</li>` : ''}
            </ul>`;
        }

        resultadoContenido.innerHTML = `
            <h3>Resultados de la Liquidación</h3>
            <p><strong>Tipo de Caja:</strong> ${tipoCaja}</p>
            <p><strong>Ciudad de Destino:</strong> ${ciudadDestinoValue}</p>
            ${detallePeso}
            <p><strong>Costo envío:</strong> $${Math.trunc(costoCaja).toLocaleString('es-CO')}</p>
            ${descuento > 0 ? `<p><strong>Descuento Aplicado:</strong> ${descuento}% ($${Math.trunc(descuentoAplicado).toLocaleString('es-CO')})</p>` : ''}
            ${kilosAdicionales > 0 ? `<p><strong>Kilos Adicionales:</strong> $${Math.trunc(kilosAdicionales).toLocaleString('es-CO')}</p>` : ""}
            <p><strong>Costo Seguro:</strong> $${Math.trunc(costoSeguro).toLocaleString('es-CO')}</p>
            <p><strong>Costo Total:</strong> $${Math.trunc(costoTotal).toLocaleString('es-CO')}</p>
        `;

        // Abrir el modal
        resultadoModal.style.display = 'block';
    });

    // Cerrar el modal de resultados
    closeResultadoBtn.addEventListener('click', function () {
        resultadoModal.style.display = 'none';
    });

    // Registrar el Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/liquidaci-n/sw.js').then(registration => {
                console.log('Service Worker registrado con éxito:', registration);
            }).catch(error => {
                console.log('Error al registrar el Service Worker:', error);
            });
        });
    }
});