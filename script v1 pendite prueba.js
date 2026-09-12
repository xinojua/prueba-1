javascript:(function(){

/*
============================================================
 TRIBAL WARS - PREPARADOR DE ÓRDENES
 ES103 / MULTIMUNDO

 IMPORTANTE:
 - NO ENVÍA ATAQUES
 - NO PULSA ATAQUE
 - NO PULSA APOYO
 - SOLO RELLENA COORDENADAS Y TROPAS
 - EL JUGADOR DEBE LANZAR LA ORDEN MANUALMENTE
============================================================
*/

'use strict';


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const CONFIG = {

    /*
     * Objetivos.
     *
     * Puedes poner tantas coordenadas como quieras.
     *
     * Formato:
     * "471|554 472|553 468|552"
     */
    coords:
        "471|554 472|553 468|552 468|551 469|548 474|550 468|561 467|569 463|571 474|539 471|540 469|533 477|532 483|539 484|535 464|537 459|533 460|536 484|527 485|528 487|526",

    /*
     * Selección del objetivo:
     *
     * random     = aleatorio
     * sequential = uno detrás de otro
     */
    sendMode: "random",

    /*
     * Tropas.
     *
     * El nombre debe coincidir con el "name" del input
     * de la Plaza.
     *
     * Si una unidad no existe en el mundo simplemente
     * será ignorada.
     *
     * Puedes modificar las cantidades.
     */
    unitAmounts: {

        spear: 0,
        sword: 0,
        axe: 0,
        archer: 0,

        spy: 0,

        light: 0,
        marcher: 0,
        heavy: 0,

        ram: 1,
        catapult: 0,

        knight: 0,
        snob: 0
    },

    /*
     * Si está activado, cualquier unidad no configurada
     * se pondrá a 0.
     *
     * Esto reproduce el comportamiento del script original.
     */
    clearOtherUnits: true
};


/* =========================================================
   COMPROBAR PLAZA
   ========================================================= */

if(
    typeof game_data === 'undefined' ||
    game_data.screen !== 'place' ||
    game_data.mode !== null
){

    if(typeof UI !== 'undefined' && UI.InfoMessage){

        UI.InfoMessage('Redirigiendo a la Plaza de Reunión...');

    }

    setTimeout(function(){

        if(
            typeof game_data !== 'undefined' &&
            game_data.link_base_pure
        ){

            window.location.assign(
                game_data.link_base_pure + 'place'
            );

        }

    },500);

    return;
}


/* =========================================================
   OBTENER COORDENADAS
   ========================================================= */

function getCoordinates(){

    return CONFIG.coords
        .split(/\s+/)
        .map(function(coord){

            return coord.trim();

        })
        .filter(function(coord){

            return /^\d{1,3}\|\d{1,3}$/.test(coord);

        });
}


const coordinates = getCoordinates();


if(!coordinates.length){

    if(typeof UI !== 'undefined' && UI.ErrorMessage){

        UI.ErrorMessage(
            'No hay coordenadas válidas configuradas.'
        );

    }else{

        alert(
            'No hay coordenadas válidas configuradas.'
        );

    }

    return;
}


/* =========================================================
   SELECCIÓN DEL OBJETIVO
   ========================================================= */

let selectedIndex = 0;


/*
 * Guardamos el índice para que la opción sequential
 * avance entre ejecuciones.
 */

const STORAGE_KEY =
    'tw_preparer_coordinate_index';


if(CONFIG.sendMode === 'random'){

    selectedIndex =
        Math.floor(
            Math.random() * coordinates.length
        );

}else{

    let previous =
        parseInt(
            localStorage.getItem(STORAGE_KEY) || '0',
            10
        );

    if(
        isNaN(previous) ||
        previous < 0 ||
        previous >= coordinates.length
    ){

        previous = 0;
    }

    selectedIndex = previous;

    localStorage.setItem(
        STORAGE_KEY,
        String(
            (previous + 1) % coordinates.length
        )
    );
}


const selectedCoordinate =
    coordinates[selectedIndex];

const parts =
    selectedCoordinate.split('|');

const targetX = parts[0];
const targetY = parts[1];


/* =========================================================
   LOCALIZAR FORMULARIO
   ========================================================= */

let form = null;


/*
 * Primero intentamos utilizar el formulario que contiene
 * las coordenadas.
 */

const xInputs =
    document.querySelectorAll(
        'input[name="x"]'
    );


for(let i=0;i<xInputs.length;i++){

    const candidate =
        xInputs[i].form;

    if(candidate){

        form = candidate;
        break;
    }
}


/*
 * Fallback.
 */

if(!form){

    form = document.forms[0];
}


if(!form){

    alert(
        'No se ha encontrado el formulario de la Plaza de Reunión.'
    );

    return;
}


/* =========================================================
   RELLENAR COORDENADAS
   ========================================================= */

const xInput =
    form.querySelector(
        'input[name="x"]'
    );

const yInput =
    form.querySelector(
        'input[name="y"]'
    );


if(!xInput || !yInput){

    alert(
        'No se han encontrado los campos X/Y.'
    );

    return;
}


xInput.value = targetX;
yInput.value = targetY;


/*
 * Disparamos eventos para que cualquier sistema de la
 * interfaz que escuche cambios detecte el valor.
 *
 * Esto NO envía ninguna orden.
 */

try{

    xInput.dispatchEvent(
        new Event('input',{bubbles:true})
    );

    xInput.dispatchEvent(
        new Event('change',{bubbles:true})
    );

    yInput.dispatchEvent(
        new Event('input',{bubbles:true})
    );

    yInput.dispatchEvent(
        new Event('change',{bubbles:true})
    );

}catch(e){}


/* =========================================================
   LOCALIZAR INPUTS DE TROPAS
   ========================================================= */

const troopInputs =
    form.querySelectorAll(
        'input.unitsInput'
    );


/*
 * También buscamos inputs por name como fallback.
 */

const allConfiguredNames =
    Object.keys(CONFIG.unitAmounts);


/* =========================================================
   PONER A CERO LAS TROPAS
   ========================================================= */

if(CONFIG.clearOtherUnits){

    for(let i=0;i<troopInputs.length;i++){

        troopInputs[i].value = 0;

    }
}


/* =========================================================
   RELLENAR TROPAS
   ========================================================= */

let selectedTroops = 0;


for(const unitName in CONFIG.unitAmounts){

    if(
        !Object.prototype.hasOwnProperty.call(
            CONFIG.unitAmounts,
            unitName
        )
    ){

        continue;
    }


    const wanted =
        parseInt(
            CONFIG.unitAmounts[unitName],
            10
        ) || 0;


    if(wanted <= 0){

        continue;
    }


    /*
     * Buscar el input por name.
     */

    const input =
        form.querySelector(
            'input[name="' +
            CSS.escape(unitName) +
            '"]'
        );


    /*
     * Si esa unidad no existe en este mundo,
     * simplemente continuamos.
     */

    if(!input){

        continue;
    }


    /* =====================================================
       OBTENER DISPONIBILIDAD
       ===================================================== */

    let available = 0;


    /*
     * Primero intentamos replicar el método de tu script
     * original:
     *
     * input.nextSibling.nextSibling.innerHTML
     */

    try{

        const node =
            input.nextSibling &&
            input.nextSibling.nextSibling;

        if(node){

            const text =
                node.textContent || '';

            const match =
                text.match(/\d+/);

            if(match){

                available =
                    parseInt(
                        match[0],
                        10
                    ) || 0;
            }
        }

    }catch(e){}


    /*
     * Fallback: buscar números en el contenedor cercano.
     */

    if(available <= 0){

        try{

            const parent =
                input.parentElement;

            if(parent){

                const text =
                    parent.textContent || '';

                const numbers =
                    text.match(/\d+/g);

                if(numbers && numbers.length){

                    /*
                     * Normalmente el último número es
                     * la disponibilidad.
                     */

                    available =
                        parseInt(
                            numbers[numbers.length - 1],
                            10
                        ) || 0;
                }
            }

        }catch(e){}
    }


    /*
     * Si no conseguimos detectar disponibilidad,
     * dejamos que el campo reciba la cantidad solicitada.
     *
     * El navegador/juego se encargará de la validación
     * cuando el jugador intente enviar manualmente.
     */

    const amount =
        available > 0
            ? Math.min(wanted,available)
            : wanted;


    input.value = amount;


    try{

        input.dispatchEvent(
            new Event(
                'input',
                {bubbles:true}
            )
        );

        input.dispatchEvent(
            new Event(
                'change',
                {bubbles:true}
            )
        );

    }catch(e){}


    if(amount > 0){

        selectedTroops += amount;
    }
}


/* =========================================================
   INFORMACIÓN
   ========================================================= */

const message =
    'Objetivo preparado: ' +
    selectedCoordinate +
    ' | Tropas: ' +
    selectedTroops;


/*
 * IMPORTANTE:
 *
 * Aquí TERMINA el script.
 *
 * NO hay:
 *
 * form.submit()
 * button.click()
 * AJAX
 * fetch()
 * XMLHttpRequest
 *
 * El jugador debe pulsar manualmente ATAQUE/APOYO.
 */

if(typeof UI !== 'undefined' && UI.InfoMessage){

    UI.InfoMessage(message);

}else{

    console.log(
        '[TW Preparador] ' + message
    );
}

})();