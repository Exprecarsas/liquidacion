document.addEventListener('DOMContentLoaded', function () {
    const ciudadDestino = document.getElementById('ciudadDestino');
    const suggestionsBox = document.getElementById('suggestions');
    const tipoCajaSelect = document.getElementById('tipoCaja');
    const pesoTotalInput = document.getElementById('pesoTotal');
    const rangoPesoDiv = document.getElementById('rangoPesoDiv');
    const rangoPesoSelect = document.getElementById('rangoPeso');
    const calcularVolumetricoBtn = document.getElementById('calcularVolumetricoBtn');
    const volumetricModal = document.getElementById('volumetricModal');
    const closeVolumetricBtn = document.querySelector('.close-volumetric-btn');
    const calcularVolumetrico = document.getElementById('calcularVolumetrico');
    const aceptarVolumetrico = document.getElementById('aceptarVolumetrico');
    const altoInput = document.getElementById('alto');
    const anchoInput = document.getElementById('ancho');
    const largoInput = document.getElementById('largo');
    const valorDeclaradoInput = document.getElementById('valorDeclarado');
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const closeModalBtn = document.querySelector('.close-btn');
    const resultadoDiv = document.getElementById('resultado');

    let tarifas = {};
    let ciudades = [];
    let pesoVolumetricoCalculado = 0;

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

    // Cerrar la ventana modal al hacer clic fuera de la ventana modal
    window.addEventListener('click', function (event) {
        if (event.target === volumetricModal) {
            volumetricModal.style.display = 'none';
        }
    });

    // Calcular el peso volumétrico
    calcularVolumetrico.addEventListener('click', function () {
        const alto = parseFloat(altoInput.value);
        const ancho = parseFloat(anchoInput.value);
        const largo = parseFloat(largoInput.value);

        if (!alto || !ancho || !largo || alto <= 0 || ancho <= 0 || largo <= 0) {
            mostrarError('Ingrese dimensiones válidas para calcular el peso volumétrico.');
            return;
        }

        // Fórmula de peso volumétrico: (Alto * Ancho * Largo) / 5000
        pesoVolumetricoCalculado = (alto * ancho * largo) / 5000;
        mostrarError(`Peso volumétrico calculado: ${pesoVolumetricoCalculado.toFixed(2)} kg.`);
    });

    // Transferir el peso volumétrico al campo de peso total
    aceptarVolumetrico.addEventListener('click', function () {
        if (pesoVolumetricoCalculado > 0) {
            pesoTotalInput.value = pesoVolumetricoCalculado.toFixed(2);
            volumetricModal.style.display = 'none';
        } else {
            mostrarError('Debe calcular el peso volumétrico primero.');
        }
    });

    // Formatear el valor declarado al escribir (mostrar puntos como separadores de miles)
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
            ciudades = [
                ...Object.keys(tarifas["calzado_nacional"] || {}),
                ...Object.keys(tarifas["calzado_reexpedicion"] || {}),
                ...Object.keys(tarifas["calzado_por_peso"] || {})
            ];
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

        // Verificar si se seleccionó el tipo de caja calzado
        if (tipoCaja === "calzado" && ciudadSeleccionada) {
            let rangosPeso = [];

            // Revisión detallada de cada categoría
            if (tarifas["calzado_nacional"] && tarifas["calzado_nacional"][ciudadSeleccionada]) {
                rangosPeso = Object.keys(tarifas["calzado_nacional"][ciudadSeleccionada]);
            } else if (tarifas["calzado_por_peso"] && tarifas["calzado_por_peso"][ciudadSeleccionada]) {
                rangosPeso = Object.keys(tarifas["calzado_por_peso"][ciudadSeleccionada]);
            } else {
                mostrarError(`La ciudad ${ciudadSeleccionada} no tiene tarifas de calzado.`);
            }

            // Verificar los rangos encontrados
            console.log(`Rangos de peso disponibles para ${ciudadSeleccionada}:`, rangosPeso);

            // Mostrar los rangos en el selector si se encuentran
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
        // Cálculo del costo total incluyendo el seguro y los kilos adicionales
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

            if (tipoCaja === "calzado" && (!rangoSeleccionado || rangoSeleccionado === "")) {
                mostrarError('Seleccione un rango de peso válido.');
                return;
            }

            let valorMinimo = tipoCaja === "calzado" ? 500000 : 500000;

            if (valorDeclarado < valorMinimo) {
                mostrarError(`El valor declarado no puede ser menor a $${valorMinimo.toLocaleString()} para la ciudad seleccionada.`);
                return;
            }

            let costoCaja = 0;
            let kilosAdicionales = 0;

            if (tipoCaja === "normal") {
                if (tarifas["normal"] && tarifas["normal"][ciudadDestinoValue]) {
                    costoCaja = tarifas["normal"][ciudadDestinoValue];
                } else {
                    mostrarError(`No se encontraron tarifas para la ciudad seleccionada.`);
                    return;
                }

                if (pesoUsado > 30) {
                    kilosAdicionales = (pesoUsado - 30) * (costoCaja / 30);
                }
            } else if (tipoCaja === "calzado") {
                if (tarifas["calzado_nacional"] && tarifas["calzado_nacional"][ciudadDestinoValue] && tarifas["calzado_nacional"][ciudadDestinoValue][rangoSeleccionado]) {
                    costoCaja = tarifas["calzado_nacional"][ciudadDestinoValue][rangoSeleccionado];
                } else {
                    mostrarError('Seleccione un rango de peso válido.');
                    return;
                }
            }

            let costoSeguro = valorDeclarado * 0.005;
            const costoTotal = (costoCaja + kilosAdicionales) * numUnidades + costoSeguro;

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
        });
    });
});
