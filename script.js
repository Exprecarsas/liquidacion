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

    // Cambiar las ciudades disponibles según el tipo de caja seleccionado
    tipoCajaSelect.addEventListener('change', function () {
        const tipoCaja = tipoCajaSelect.value;

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
    });

    // Actualizar los rangos de peso según la ciudad seleccionada
    ciudadDestino.addEventListener('change', function () {
        const ciudadSeleccionada = ciudadDestino.value;
        const tipoCaja = tipoCajaSelect.value;

        if (tipoCaja === "calzado" && ciudadSeleccionada) {
            let rangosPeso = [];

            // Verificar si la ciudad tiene rangos de peso definidos
            if (tarifas["calzado_nacional"] && tarifas["calzado_nacional"][ciudadSeleccionada]) {
                rangosPeso = Object.keys(tarifas["calzado_nacional"][ciudadSeleccionada]);
            } else if (tarifas["calzado_por_peso"] && tarifas["calzado_por_peso"][ciudadSeleccionada]) {
                rangosPeso = Object.keys(tarifas["calzado_por_peso"][ciudadSeleccionada]);
            }

            // Mostrar los rangos de peso en el select
            if (rangosPeso.length > 0) {
                rangoPesoSelect.innerHTML = '<option value="" disabled selected>Seleccione un rango de peso</option>';
                rangosPeso.forEach(rango => {
                    rangoPesoSelect.innerHTML += `<option value="${rango}">${rango} kg</option>`;
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

    // Cálculo del costo total incluyendo el seguro y los kilos adicionales
    document.getElementById('calcularBtn').addEventListener('click', function () {
        const tipoCaja = tipoCajaSelect.value;
        const numUnidades = parseInt(document.getElementById('numUnidades').value);
        const valorDeclaradoStr = valorDeclaradoInput.value.replace(/\./g, '');
        const valorDeclarado = parseFloat(valorDeclaradoStr);
        const ciudadDestinoValue = ciudadDestino.value;
        let pesoUsado = parseFloat(pesoTotalInput.value) || 0;

        if (!tipoCaja || !ciudadDestinoValue || !ciudades.includes(ciudadDestinoValue)) {
            mostrarError('Seleccione un tipo de caja y una ciudad válida de destino.');
            return;
        }

        let valorMinimo;
        if (tarifas["calzado_reexpedicion"] && tarifas["calzado_reexpedicion"][ciudadDestinoValue]) {
            valorMinimo = 1000000;
        } else if (tipoCaja === "calzado") {
            valorMinimo = 500000;
        } else {
            valorMinimo = 500000;
        }

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
            const rangoSeleccionado = rangoPesoSelect.value;
            if (tarifas["calzado_nacional"] && tarifas["calzado_nacional"][ciudadDestinoValue] && tarifas["calzado_nacional"][ciudadDestinoValue][rangoSeleccionado]) {
                costoCaja = tarifas["calzado_nacional"][ciudadDestinoValue][rangoSeleccionado];
            } else {
                mostrarError('Seleccione un rango de peso válido.');
                return;
            }
        }

        let costoSeguro = valorDeclarado * (valorDeclarado <= valorMinimo ? 0.01 : 0.005);
        const costoTotal = (costoCaja + kilosAdicionales) * numUnidades + costoSeguro;

        // Mostrar resultados basados en el tipo de caja
        if (tipoCaja === "calzado") {
            resultadoDiv.innerHTML = `
                <h3>Resultados de la Liquidación</h3>
                <p><strong>Tipo de Caja:</strong> ${tipoCaja}</p>
                <p><strong>Ciudad de Destino:</strong> ${ciudadDestinoValue}</p>
                <p><strong>Rango de Peso:</strong> ${rangoSeleccionado} kg</p>
                <p><strong>Costo Base:</strong> $${costoCaja.toFixed(2)}</p>
                <p><strong>Costo Seguro:</strong> $${costoSeguro.toFixed(2)}</p>
                <p><strong>Costo Total:</strong> $${costoTotal.toFixed(2)}</p>
            `;
        } else {
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
        }
    });
});
