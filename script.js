document.addEventListener('DOMContentLoaded', function () {
    const ciudadDestino = document.getElementById('ciudadDestino');
    const suggestionsBox = document.getElementById('suggestions');
    const tipoCajaSelect = document.getElementById('tipoCaja');
    const pesoTotalInput = document.getElementById('pesoTotal');
    const rangoPesoDiv = document.getElementById('rangoPesoDiv');
    const rangoPesoSelect = document.getElementById('rangoPeso');

    let tarifas = {};
    let ciudades = [];

    // Cargar las tarifas desde el archivo JSON
    fetch('tarifas_completas_actualizadas.json')
        .then(response => response.json())
        .then(data => {
            tarifas = data;
        })
        .catch(error => console.error('Error al cargar el archivo de tarifas:', error));

    // Cambiar las ciudades disponibles según el tipo de caja seleccionado
    tipoCajaSelect.addEventListener('change', function () {
        if (this.value === "calzado") {
            ciudades = Object.keys(tarifas["calzado_nacional"]);
            rangoPesoDiv.style.display = "block";  // Mostrar la selección de rangos de peso
            pesoTotalInput.disabled = true;  // Deshabilitar el campo de peso manual
            pesoTotalInput.value = "";  // Limpiar el campo de peso manual
        } else if (this.value === "normal") {
            ciudades = Object.keys(tarifas["normal"]);
            rangoPesoDiv.style.display = "none";  // Ocultar la selección de rangos de peso
            pesoTotalInput.disabled = false;  // Habilitar el campo de peso manual
        } else {
            ciudades = [];
        }
        ciudadDestino.value = '';
        suggestionsBox.innerHTML = '';
    });

    // Mostrar los rangos de peso según la ciudad seleccionada
    ciudadDestino.addEventListener('change', function () {
        const ciudadSeleccionada = ciudadDestino.value;
        const tipoCaja = tipoCajaSelect.value;

        if (tipoCaja === "calzado" && tarifas["calzado_nacional"][ciudadSeleccionada]) {
            const rangosPeso = Object.keys(tarifas["calzado_nacional"][ciudadSeleccionada]);
            rangoPesoSelect.innerHTML = '<option value="" disabled selected>Seleccione un rango de peso</option>';
            rangosPeso.forEach(rango => {
                rangoPesoSelect.innerHTML += `<option value="${rango}">${rango} kg</option>`;
            });
            rangoPesoDiv.style.display = "block";
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

    // Cálculo del costo total
    document.getElementById('calcularBtn').addEventListener('click', function () {
        const tipoCaja = tipoCajaSelect.value;
        const numUnidades = parseInt(document.getElementById('numUnidades').value);
        let pesoTotal = parseFloat(document.getElementById('pesoTotal').value);
        const valorDeclarado = parseFloat(document.getElementById('valorDeclarado').value);
        const ciudadDestinoValue = ciudadDestino.value;

        if (!tipoCaja || !ciudadDestinoValue || !tarifas[tipoCaja][ciudadDestinoValue]) {
            document.getElementById('resultado').innerHTML = `<p style="color: red;">Seleccione un tipo de caja y una ciudad válida de destino.</p>`;
            return;
        }

        let costoTotal = 0;
        if (tipoCaja === "calzado") {
            const rangoSeleccionado = rangoPesoSelect.value;
            if (!rangoSeleccionado) {
                document.getElementById('resultado').innerHTML = `<p style="color: red;">Seleccione un rango de peso para la caja de calzado.</p>`;
                return;
            }
            // Costo basado en el rango de peso seleccionado
            costoTotal = tarifas["calzado_nacional"][ciudadDestinoValue][rangoSeleccionado];
        } else {
            costoTotal = tarifas["normal"][ciudadDestinoValue];
        }

        document.getElementById('resultado').innerHTML = `
            <h3>Resultados de la Liquidación</h3>
            <p>Tipo de Caja: ${tipoCaja === 'normal' ? 'Caja Normal' : 'Caja de Calzado'}</p>
            <p>Ciudad de Destino: ${ciudadDestinoValue}</p>
            <p><strong>Costo Total: $${costoTotal.toLocaleString()}</strong></p>
        `;
    });
});
