let ERROR = 'ERROR';
let currentTripId = 'currentTripId';
let db = window.openDatabase('expense', '1.0', 'expense', 20000);

$(document).on('ready', onDeviceReady);

$(document).on('click', '#page-home #panel-open', function () {
    $('#page-home #panel').panel('open');
});

$(document).on('click', '#adding-page #panel-open', function () {
    $('#adding-page #panel').panel('open');
});

$(document).on('click', '#page-list #panel-open', function () {
    $('#page-list #panel').panel('open');
});

$(document).on('click', '#page-about #panel-open', function () {
    $('#page-about #panel').panel('open');
});

$(document).on('click', '#page-home #btn-reset', function () {
    db.transaction(function (tx) {
        query = `DROP TABLE Trip`;
        tx.executeSql(query, [], function (tx, result) {
            log(`Drop table 'Trip' successfully.`);

            prepareDatabase(db);

            toast('Reset successfully.')
        }, transactionError);
    });
});

// Page CREATE
$(document).on('submit', '#adding-page #form-create', confirmTrip);
$(document).on('submit', '#adding-page #form-confirm', createTrip);
$(document).on('click', '#adding-page #form-confirm #edit', function () {
    $('#adding-page #form-confirm').popup('close');
});

// Page LIST
$(document).on('pagebeforeshow', '#page-list', showList);

$(document).on('submit', '#page-list #form-search', search);

$(document).on('keyup', $('#page-list #txt-filter'), filterTrip);

$(document).on('click', '#page-list #btn-reset', showList);
$(document).on('click', '#page-list #btn-filter-popup', openFormSearch);
$(document).on('click', '#page-list #list-trip li a', navigatePagedata);

// Page data
$(document).on('pagebeforeshow', '#page-data', showdata);

$(document).on('click', '#page-data #btn-update-popup', showUpdate);
$(document).on('click', '#page-data #btn-delete-popup', function () {
    changePopup($('#page-data #option'), $('#page-data #form-delete'));
});

$(document).on('click', '#page-data #form-update #cancel', function () {
    $('#page-data #form-update').popup('close');
});

$(document).on('submit', '#page-data #form-update', updateTrip);
$(document).on('submit', '#page-data #form-delete', deleteTrip);
$(document).on('keyup', '#page-data #form-delete #txt-confirm', confirmDeleteTrip);

function onDeviceReady() {
    log(`Device is ready.`);

    prepareDatabase(db);
}

function log(message, type = 'INFO') {
    console.log(`${new Date()} [${type}] ${message}`);
}

function changePopup(sourcePopup, destinationPopup) {
    let afterClose = function () {
        destinationPopup.popup("open");
        sourcePopup.off("popupafterclose", afterClose);
    };

    sourcePopup.on("popupafterclose", afterClose);
    sourcePopup.popup("close");
}

function confirmTrip(e) {
    e.preventDefault();

    log('Open the confirmation popup.');

    $('#adding-page #form-confirm #name').text($('#adding-page #form-create #name').val());
    $('#adding-page #form-confirm #destination').text($('#adding-page #form-create #destination').val());
    $('#adding-page #form-confirm #member').text($('#adding-page #form-create #member').val());
    $('#adding-page #form-confirm #transportation').text($('#adding-page #form-create #transportation').val());
    $('#adding-page #form-confirm #date').text($('#adding-page #form-create #date').val());
    $('#adding-page #form-confirm #description').text($('#adding-page #form-create #description').val());
    $('#adding-page #form-confirm #risk').text($('#adding-page #form-create #risk').val());

    $('#adding-page #form-confirm').popup('open');
}

function createTrip(e) {
    e.preventDefault();

    let name = $('#adding-page #form-create #name').val();
    let destination = $('#adding-page #form-create #destination').val();
    let member = $('#adding-page #form-create #member').val();
    let transportation = $('#adding-page #form-create #transportation').val();
    let date = $('#adding-page #form-create #date').val();
    let description = $('#adding-page #form-create #description').val();
    let risk = $('#adding-page #form-create #risk').val();

    db.transaction(function (tx) {
        let query = `INSERT INTO Trip (Name, Destination, Member, Transportation, Description, Risk, Date) VALUES (?, ?, ?, ?, ?, ?, julianday('${date}'))`;
        tx.executeSql(query, [name, destination, member, transportation, description, risk], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            let message = `Successfully adding: '${name}'.`;

            log(message);
            toast(message);

            $('#adding-page #form-create').trigger('reset');
            $('#adding-page #form-create #name').focus();

            $('#adding-page #form-confirm').popup('close');
        }
    });
}

function showList() {
    db.transaction(function (tx) {
        let query = `SELECT *, date(Date) AS DateConverted FROM Trip`;

        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of trips successfully.`);
            displayList(result.rows);
        }
    });
}

function navigatePagedata(e) {
    e.preventDefault();

    let id = $(this).data('datas').Id;
    localStorage.setItem(currentTripId, id);

    $.mobile.navigate('#page-data', { transition: 'none' });
}

function showdata() {
    let id = localStorage.getItem(currentTripId);

    db.transaction(function (tx) {
        let query = `SELECT *, date(Date) AS DateConverted FROM Trip WHERE Id = ?`;

        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            if (result.rows[0] != null) {
                log(`Get datas of trip '${result.rows[0].name}' successfully.`);

                $('#page-data #data #name').text(result.rows[0].Name);
                $('#page-data #data #destination').text(result.rows[0].Destination);
                $('#page-data #data #member').text(result.rows[0].Member);
                $('#page-data #data #transportation').text(result.rows[0].Transportation);
                $('#page-data #data #description').text(result.rows[0].Description);
                $('#page-data #data #risk').text(result.rows[0].Risk);
                $('#page-data #data #date').text(result.rows[0].DateConverted);
            }
            else {
                let errorMessage = 'Trip not found.';

                log(errorMessage, ERROR);

                $('#page-data #data #name').text(errorMessage);
                $('#page-data #btn-update').addClass('ui-disabled');
                $('#page-data #btn-delete-confirm').addClass('ui-disabled');
            }
        }
    });
}

function confirmDeleteTrip() {
    let text = $('#page-data #form-delete #txt-confirm').val();

    if (text == 'yes') {
        $('#page-data #form-delete #btn-delete').removeClass('ui-disabled');
    }
    else {
        $('#page-data #form-delete #btn-delete').addClass('ui-disabled');
    }
}

function deleteTrip(e) {
    e.preventDefault();

    let tripId = localStorage.getItem(currentTripId);

    db.transaction(function (tx) {
        let name = '';

        let query = 'SELECT * FROM Trip WHERE Id = ?';
        tx.executeSql(query, [tripId], function (tx, result) {
            name = result.rows[0].Name;
        }, transactionError);

        query = 'DELETE FROM Trip WHERE Id = ?';
        tx.executeSql(query, [tripId], function (tx, result) {
            let message = `Deleted trip '${name}'.`;

            log(message);
            toast(message);

            $('#page-data #form-delete').trigger('reset');

            $.mobile.navigate('#page-list', { transition: 'none' });
        }, transactionError);
    });
}

function showUpdate() {
    let id = localStorage.getItem(currentTripId);

    db.transaction(function (tx) {
        let query = `SELECT *, date(Date) as DateConverted FROM Trip WHERE Id = ?`;

        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            if (result.rows[0] != null) {
                log(`Get datas of trip '${result.rows[0].Name}' successfully.`);

                $(`#page-data #form-update #name`).val(result.rows[0].Name);
                $(`#page-data #form-update #destination`).val(result.rows[0].Destination);
                $(`#page-data #form-update #member`).val(result.rows[0].Member);
                $(`#page-data #form-update #transportation`).val(result.rows[0].Transportation);
                $(`#page-data #form-update #risk`).val(result.rows[0].Risk).slider("refresh");
                $(`#page-data #form-update #date`).val(result.rows[0].DateConverted);
                $(`#page-data #form-update #description`).val(result.rows[0].Description);

                changePopup($('#page-data #option'), $('#page-data #form-update'));
            }
        }
    });
}

function updateTrip(e) {
    e.preventDefault();

    let id = localStorage.getItem(currentTripId);
    let name = $('#page-data #form-update #name').val();
    let destination = $('#page-data #form-update #destination').val();
    let member = $('#page-data #form-update #member').val();
    let transportation = $('#page-data #form-update #transportation').val();
    let date = $('#page-data #form-update #date').val();
    let description = $('#page-data #form-update #description').val();
    let risk = $('#page-data #form-update #risk').val();

    db.transaction(function (tx) {
        let query = `UPDATE Trip SET Name = ?, Destination = ?, Member = ?, Transportation = ?, Description = ?, Risk = ?, Date = julianday('${date}') WHERE Id = ?`;

        tx.executeSql(query, [name, destination, member, transportation, description, risk, id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            let message = `Updated trip '${name}'.`;

            log(message);
            toast(message);

            showdata();

            $('#page-data #form-update').popup('close');
        }
    });
}

function filterTrip() {
    let filter = $('#page-list #txt-filter').val().toLowerCase();
    let li = $('#page-list #list-trip ul li');

    for (let i = 0; i < li.length; i++) {
        let a = li[i].getElementsByTagName('a')[0];
        let text = a.textContent || a.innerText;

        li[i].style.display = text.toLowerCase().indexOf(filter) > -1 ? '' : 'none';
    }
}

function openFormSearch(e) {
    e.preventDefault();
    $('#page-list #form-search').popup('open');
}

function search(e) {
    e.preventDefault();

    let name = $('#page-list #form-search #name').val();
    let destination = $('#page-list #form-search #destination').val();
    let date = $('#page-list #form-search #date').val();

    db.transaction(function (tx) {
        let query = `SELECT *, date(Date) as DateConverted FROM Trip WHERE`;

        query += name ? ` Name LIKE "%${name}%"   AND` : '';
        query += destination ? ` Destination LIKE "%${destination}%"   AND` : '';
        query += date ? ` Date = julianday('${date}')   AND` : '';

        query = query.substring(0, query.length - 6);

        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Search trips successfully.`);

            displayList(result.rows);

            $('#page-list #form-search').trigger('reset');
            $('#page-list #form-search').popup('close');
        }
    });
}

function displayList(list) {
    let tripList = `<ul id='list-trip' data-role='listview' class='ui-nodisc-icon ui-alt-icon'>`;

    tripList += list.length == 0 ? '<li><h2>There is no trip.</h2></li>' : '';

    for (let trip of list) {
        tripList +=
            `<li><a data-datas='{"Id" : ${trip.Id}}'>
                <h6>${trip.Name}</h6>
                <p><small>${trip.DateConverted} - <em>${trip.Destination}</em></small></p>
            </a></li>`;
    }
    tripList += `</ul>`;

    $('#list-trip').empty().append(tripList).listview('refresh').trigger('create');

    log(`Completely showing trip.`);
}

function toast(message) {
    $("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'><p>" + message + "</p></div>")
        .css({
            background: 'transparent',
            color: 'black',
            font: '12px Arial, sans-serif',
            display: 'block',
            opacity: 1,
            position: 'fixed',
            padding: '2px',
            'border-radius': '25px',
            'text-align': 'center',
            'box-shadow': 'none',
            '-moz-box-shadow': 'none',
            '-webkit-box-shadow': 'none',
            width: '250px',
            left: ($(window).width() - 254) / 2,
            top: $(window).height() - 115
        })

        .appendTo($.mobile.pageContainer).delay(3500)

        .fadeOut(400, function () {
            $(this).remove();
        });
}