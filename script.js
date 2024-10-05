document.addEventListener('DOMContentLoaded', function () {
    const ciudadDestino = document.getElementById('ciudadDestino');
    const suggestionsBox = document.getElementById('suggestions');
    const tipoCajaSelect = document.getElementById('tipoCaja');
    const pesoTotalInput = document.getElementById('pesoTotal');
    const rangoPesoDiv = document.getElementById('rangoPesoDiv');
    const rangoPesoSelect = document.getElementById('rangoPeso');
    const valorDeclaradoInput = document.getElementById('valorDeclarado');
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const closeModalBtn = document.querySelector('.close-btn');

    let tarifas = {};
    let ciudades = [];

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

    // Cerrar el modal al hacer clic en la 'X'
    closeModalBtn.addEventListener('click', function () {
        errorModal.style.display = "none";
    });

    // Cerrar el modal al hacer clic fuera de la ventana modal
    window.addEventListener('click', function (event) {
        if (event.target === errorModal) {
            errorModal.style.display = "none";
        }
    });

    // Aplicar formato de puntos al valor declarado
    valorDeclaradoInput.addEventListener('input', function () {
        let valor = valorDeclaradoInput.value.replace(/\D/g, '');  // Eliminar caracteres no numéricos
        valorDeclaradoInput.value = new Intl.NumberFormat('de-DE').format(valor);  // Aplicar formato con puntos
    });

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

    // Cálculo del costo total incluyendo el seguro
    document.getElementById('calcularBtn').addEventListener('click', function () {
        const tipoCaja = tipoCajaSelect.value;
        const numUnidades = parseInt(document.getElementById('numUnidades').value);
        const valorDeclaradoStr = valorDeclaradoInput.value.replace(/\./g, '');  // Eliminar los puntos para convertir a número
        const valorDeclarado = parseFloat(valorDeclaradoStr);
        const ciudadDestinoValue = ciudadDestino.value;

        if (!tipoCaja || !ciudadDestinoValue || !tarifas[tipoCaja][ciudadDestinoValue]) {
            mostrarError('Seleccione un tipo de caja y una ciudad válida de destino.');
            return;
        }

        // Validar los valores mínimos de seguro según el tipo de caja
        const valorMinimoCajaNormal = 500000;
        const valorMinimoCalzado = 1000000;
        let valorMinimo = tipoCaja === "calzado" ? valorMinimoCalzado : valorMinimoCajaNormal;

        // Verificar el valor declarado y mostrar un error si es menor al valor mínimo permitido
        if (valorDeclarado < valorMinimo) {
            mostrarError(`El valor declarado no puede ser menor a $${valorMinimo.toLocaleString()} para ${tipoCaja === "calzado" ? 'Caja de Calzado' : 'Caja Normal'}.`);
            return;
        }

        let costoCaja = 0;
        if (tipoCaja === "calzado") {
            const rangoSeleccionado = rangoPesoSelect.value;
            if (!rangoSeleccionado) {
                mostrarError('Seleccione un rango de peso para la caja de calzado.');
                return;
            }
            // Costo basado en el rango de peso seleccionado
            costoCaja = tarifas["calzado_nacional"][ciudadDestinoValue][rangoSeleccionado];
        } else {
            costoCaja = tarifas["normal"][ciudadDestinoValue];
        }

        // Calcular el costo total por todas las unidades de cajas
        const costoTotalCajas = costoCaja * numUnidades;

        // Cálculo del seguro con el porcentaje correspondiente
        let porcentajeSeguro = valorDeclarado <= valorMinimo ? 0.01 : 0.005;
        const costoSeguro = valorDeclarado * porcentajeSeguro;

        // Calcular el total con el seguro incluido
        const costoTotalFinal = costoTotalCajas + costoSeguro;

        document.getElementById('resultado').innerHTML = `
            <h3>Resultados de la Liquidación</h3>
            <p>Tipo de Caja: ${tipoCaja === 'normal' ? 'Caja Normal' : 'Caja de Calzado'}</p>
            <p>Cantidad de Unidades: ${numUnidades}</p>
            <p>Ciudad de Destino: ${ciudadDestinoValue}</p>
            <p>Valor Declarado: $${valorDeclarado.toLocaleString()}</p>
            <p>Costo del Seguro: $${costoSeguro.toLocaleString()}</p>
            <p>Costo Total de las Cajas: $${costoTotalCajas.toLocaleString()}</p>
            <p><strong>Costo Total Final: $${costoTotalFinal.toLocaleString()}</strong></p>
        `;
    });
});

