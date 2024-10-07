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

    // Abrir la ventana modal de cálculo volumétrico
    calcularVolumetricoBtn.addEventListener('click', function () {
        volumetricModal.style.display = 'block';
    });

    // Cerrar la ventana modal de cálculo volumétrico
    closeVolumetricBtn.addEventListener('click', function () {
        volumetricModal.style.display = 'none';
    });

    // Cerrar la ventana modal al hacer clic fuera de la ventana
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

        if (!alto || !ancho || !largo) {
            alert('Debe ingresar dimensiones válidas para calcular el peso volumétrico.');
            return;
        }

        pesoVolumetricoCalculado = (alto * ancho * largo) / 5000;
        alert(`El peso volumétrico calculado es de: ${pesoVolumetricoCalculado.toFixed(2)} kg`);
    });

    // Transferir el peso volumétrico al campo de peso total
    aceptarVolumetrico.addEventListener('click', function () {
        if (pesoVolumetricoCalculado > 0) {
            pesoTotalInput.value = pesoVolumetricoCalculado.toFixed(2);
            volumetricModal.style.display = 'none';
        } else {
            alert('Debe calcular el peso volumétrico primero.');
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

        if (tipoCaja === "calzado") {
            ciudades = [
                ...Object.keys(tarifas["calzado_nacional"]),
                ...Object.keys(tarifas["calzado_reexpedicion"]),
                ...Object.keys(tarifas["calzado_por_peso"])
            ];
            rangoPesoDiv.style.display = "block";  // Mostrar la selección de rangos de peso
            pesoTotalInput.disabled = true;  // Deshabilitar el campo de peso manual
            pesoTotalInput.value = "";  // Limpiar el campo de peso manual
        } else if (tipoCaja === "normal") {
            ciudades = Object.keys(tarifas["normal"]);
            rangoPesoDiv.style.display = "none";  // Ocultar la selección de rangos de peso
            pesoTotalInput.disabled = false;  // Habilitar el campo de peso manual
        } else {
            ciudades = [];
        }
        ciudadDestino.value = '';
        suggestionsBox.innerHTML = '';
    });

    // Mostrar los rangos de peso según la ciudad seleccionada para calzado
    ciudadDestino.addEventListener('change', function () {
        const ciudadSeleccionada = ciudadDestino.value;
        const tipoCaja = tipoCajaSelect.value;

        if (tipoCaja === "calzado") {
            let rangosPeso = [];

            if (tarifas["calzado_nacional"][ciudadSeleccionada]) {
                rangosPeso = Object.keys(tarifas["calzado_nacional"][ciudadSeleccionada]);
            } else if (tarifas["calzado_por_peso"][ciudadSeleccionada]) {
                rangosPeso = Object.keys(tarifas["calzado_por_peso"][ciudadSeleccionada]);
            }

            if (rangosPeso.length > 0) {
                rangoPesoSelect.innerHTML = '<option value="" disabled selected>Seleccione un rango de peso</option>';
                rangosPeso.forEach(rango => {
                    rangoPesoSelect.innerHTML += `<option value="${rango}">${rango} kg</option>`;
                });
                rangoPesoDiv.style.display = "block";
            } else {
                rangoPesoDiv.style.display = "none";
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

        // Validar si la ciudad seleccionada existe en las tarifas del tipo de caja
        if (!tipoCaja || !ciudadDestinoValue || !ciudades.includes(ciudadDestinoValue)) {
            mostrarError('Seleccione un tipo de caja y una ciudad válida de destino.');
            return;
        }

        // Definir el valor mínimo según el tipo de tarifa
        let valorMinimo;
        if (tarifas["calzado_reexpedicion"][ciudadDestinoValue]) {
            valorMinimo = 1000000; // Mínimo para calzado reexpedición
        } else if (tipoCaja === "calzado") {
            valorMinimo = 500000; // Mínimo para calzado nacional o por peso
        } else {
            valorMinimo = 500000; // Mínimo para caja normal
        }

        // Validar el valor mínimo permitido
        if (valorDeclarado < valorMinimo) {
            mostrarError(`El valor declarado no puede ser menor a $${valorMinimo.toLocaleString()} para la ciudad seleccionada.`);
            return;
        }

        let costoCaja = 0;
        if (tipoCaja === "calzado") {
            const rangoSeleccionado = rangoPesoSelect.value;
            if (tarifas["calzado_nacional"][ciudadDestinoValue] && tarifas["calzado_nacional"][ciudadDestinoValue][rangoSeleccionado]) {
                costoCaja = tarifas["calzado_nacional"][ciudadDestinoValue][rangoSeleccionado];
            } else if (tarifas["calzado_por_peso"][ciudadDestinoValue] && tarifas["calzado_por_peso"][ciudadDestinoValue][rangoSeleccionado]) {
                costoCaja = tarifas["calzado_por_peso"][ciudadDestinoValue][rangoSeleccionado];
            } else if (tarifas["calzado_reexpedicion"][ciudadDestinoValue]) {
                costoCaja = tarifas["calzado_reexpedicion"][ciudadDestinoValue]["Unnamed: 1"];
            }
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

        // Mostrar los resultados
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

