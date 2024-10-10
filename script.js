document.addEventListener('DOMContentLoaded', function () {
    const ciudadDestino = document.getElementById('ciudadDestino');
    const suggestionsBox = document.getElementById('suggestions');
    const tipoCajaSelect = document.getElementById('tipoCaja');
    const pesoTotalInput = document.getElementById('pesoTotal');
    const rangoPesoDiv = document.getElementById('rangoPesoDiv');
    const rangoPesoSelect = document.getElementById('rangoPeso');
    const valorDeclaradoInput = document.getElementById('valorDeclarado');
    const calcularVolumetricoBtn = document.getElementById('calcularVolumetricoBtn');
    const volumetricModal = document.getElementById('volumetricModal');
    const aceptarVolumetrico = document.getElementById('aceptarVolumetrico');
    const altoInput = document.getElementById('alto');
    const anchoInput = document.getElementById('ancho');
    const largoInput = document.getElementById('largo');
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const closeErrorBtn = document.querySelector('.close-btn');
    const resultadoDiv = document.getElementById('resultado');
    const resultadoModal = document.getElementById('resultadoModal');
    const closeResultadoBtn = document.querySelector('.close-modal-btn');
    const closeVolumetricBtn = document.querySelector('.close-volumetric-btn');

    let tarifas = {};
    let ciudades = [];
    let pesoVolumetricoCalculado = 0;

    // Lista de ciudades seguro mínimo de 1,000,000 y tasa del 1% solo para calzado
    const ciudadesCalzadoSeguro1Porciento = [
        "POPAYAN", "PASTO", "NEIVA", "VILLAVICENCIO", "TUNJA", 
        "TUMACO", "MOCOA", "GARZON", "FLORENCIA", "BUENAVENTURA",
        "NEPOCLI","APARTADO","CAUCACIA","YOPAL","DUITAMA","MITU",
        "YARUMAL","TARAZA","PLANETA RICA","SAN MARCO","LORICA",
        "PLATO","EL CARMEN DE BOLIVAR","ARMOBELETES","TIERRA ALTA","CHINU"
    ];

    // Cargar las tarifas desde el archivo JSON
    fetch('tarifas_completas_actualizadas.json')
        .then(response => response.json())
        .then(data => {
            tarifas = data;
            console.log("Tarifas cargadas:", tarifas);
        })
        .catch(error => console.error('Error al cargar el archivo de tarifas:', error));

    // Mostrar el modal con el mensaje de error
    function mostrarError(mensaje) {
        errorMessage.textContent = mensaje;
        errorModal.style.display = "block";
    }

    // Cerrar el modal de error al hacer clic en la 'X'
    closeModalBtn.addEventListener('click', function () {
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
    
    // Cambiar las ciudades disponibles según el tipo de caja seleccionado
    tipoCajaSelect.addEventListener('change', function () {
        const tipoCaja = tipoCajaSelect.value;
        actualizarCiudades(tipoCaja);
    });

    function actualizarCiudades(tipoCaja) {
        if (tipoCaja === "calzado") {
            ciudades = Object.keys(tarifas["calzado"] || {});
            rangoPesoDiv.style.display = "block";
            pesoTotalInput.disabled = true;
            pesoTotalInput.value = "";
        } else if (tipoCaja === "normal") {
            ciudades = Object.keys(tarifas["normal"] || {});
            rangoPesoDiv.style.display = "none";
            pesoTotalInput.disabled = false;
        } else {
            ciudades = [];
        }
        ciudadDestino.value = '';
        suggestionsBox.innerHTML = '';
    }

    // Actualizar los rangos de peso según la ciudad seleccionada
    ciudadDestino.addEventListener('change', function () {
        const ciudadSeleccionada = ciudadDestino.value.trim().toUpperCase();
        const tipoCaja = tipoCajaSelect.value;

        if (tipoCaja === "calzado" && ciudadSeleccionada) {
            let rangosPeso = [];

            if (tarifas["calzado"][ciudadSeleccionada]) {
                rangosPeso = Object.keys(tarifas["calzado"][ciudadSeleccionada]);
            }

            if (rangosPeso.length > 0) {
                rangoPesoSelect.innerHTML = '<option value="" disabled selected>Seleccione un rango de peso</option>';
                rangosPeso.forEach(rango => {
                    rangoPesoSelect.innerHTML += `<option value="${rango.trim()}">${rango.trim()}</option>`;
                });
                rangoPesoDiv.style.display = "block";
            } else {
                rangoPesoDiv.style.display = "none";
                mostrarError(`No se encontraron rangos de peso para la ciudad seleccionada: ${ciudadSeleccionada}.`);
            }
        } else {
            rangoPesoDiv.style.display = "none";
        }
    });

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
        let rangoSeleccionado = tipoCaja === 'calzado' ? rangoPesoSelect.value : null;

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
        if (tarifas["calzado"] && tarifas["calzado"][ciudadDestinoValue] && tarifas["calzado"][ciudadDestinoValue][rangoSeleccionado]) {
            costoCaja = tarifas["calzado"][ciudadDestinoValue][rangoSeleccionado] * numUnidades; // Multiplicar por número de unidades
        } else {
            mostrarError('Seleccione un rango de peso válido.');
            return;
        }
    }

    // Ajustar los cálculos de costo total
    const costoTotal = costoCaja + kilosAdicionales + costoSeguro;  // Suma de todos los costos sin multiplicar kilos adicionales por unidades
        
        // Mostrar los resultados en el modal
        resultadoDiv.innerHTML = `
            <h3>Resultados de la Liquidación</h3>
            <p><strong>Tipo de Caja:</strong> ${tipoCaja}</p>
            <p><strong>Ciudad de Destino:</strong> ${ciudadDestinoValue}</p>
            <p><strong>Peso Total:</strong> ${pesoUsado} kg</p>
            <p><strong>Costo Base:</strong> $${costoCaja.toFixed(2)}</p>
            <p><strong>Kilos Adicionales:</strong> $${kilosAdicionales.toFixed(2)}</p>
            <p><strong>Costo Seguro:</strong> $${costoSeguro.toFixed(2)}</p>
            <p><strong>Costo Total:</strong> $${costoTotal.toFixed(2)}</p>
        `;

        // Abrir el modal
        resultadoModal.style.display = 'block';
    });

    // Cerrar el modal de resultados
    closeResultadoBtn.addEventListener('click', function () {
        resultadoModal.style.display = 'none';
    });

    function mostrarError(mensaje) {
        alert(mensaje);
    }
});
