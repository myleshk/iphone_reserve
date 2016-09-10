$(document).ready(function() {
    $.getJSON("api/index.php", {
        do: 'stores'
    }, function(data) {
        // console.log(data);
        if (data.stores) var stores = data.stores;
        var store_list = {};
        $.each(stores, function() {
            store_list[this.storeNumber] = this;
        });
        window.store_list = store_list;
        loadData(true);
        setInterval(loadData, 5000);
    });

    function loadData(initial) {
        $.getJSON("api/index.php", {
            do: 'availability'
        }, function(data) {
            // console.log(data);
            var $table = $('table.availability');
            var store_list = window.store_list;
            var store;
            var model_obj = {};
            var headers = [];
            $.each(data, function(k, v) {
                if (k in store_list) {
                    // this is a store
                    store = store_list[k];
                    if (!store.storeEnabled) console.warn("Store", store.storeNumber, store, storeName, "not enabled!");
                    console.log(store.storeName, v);
                    $.each(v, function(kk, vv) {
                        if (model_obj[kk] === undefined) {
                            model_obj[kk] = {};
                        }
                        model_obj[kk][store.storeNumber] = vv;
                    });
                    if (initial) $table.find('thead>tr').append('<th class="' + store.storeNumber + '">' + store.storeName + '</th>');
                    headers.push(store.storeNumber);
                }
            });
            var timeSlot;
            $table.find('tbody tr').remove();
            $.each(model_obj, function(k, v) {
                // console.log(k, v);
                if (k.length !== 9) return timeSlot = v;
                $table.find('tbody').append('<tr id="' + k + '"><td class="model">' + k + '</td></tr>');
                var contents = [];
                $.each(headers, function(kk, vv) {
                    contents[kk] = v[vv];
                });
                // console.log(contents);
                var $row = $table.find('tbody tr#' + CSS.escape(k));
                $.each(contents, function() {
                    var icon = "";
                    var status = this.trim().toLowerCase();
                    switch (status) {
                        case 'none':
                            icon = '<i class="fa fa-times text-danger"></i>';
                            break;
                        case 'all':
                            icon = '<i class="fa fa-check text-success"></i>';
                            break;
                        default:
                            icon = '<span class="text-warning">' + status + '</span>';
                    }
                    $row.append('<td>' + icon + '</td>');
                });
            })
            var $timeSlotRow = $table.find('tbody').append('<tr id="time-slot"><td>Available Time</td></tr>').find('tr#time-slot');
            var timeSlotSorted = [];
            $.each(headers, function(k, v) {
                timeSlotSorted[k] = timeSlot[v];
            });
            $.each(timeSlotSorted, function(k, v) {
                var time = v ? (v['en_HK'] ? v['en_HK']['timeslotTime'] : 'N/A') : 'N/A';
                $timeSlotRow.append('<td>' + time + '</td>');
            });
        });
    }
});

function filter() {
    var color = $('#color').val().toLowerCase();
    var storage = $('#storage').val().toLowerCase();
    var size = $('#size').val().toLowerCase();
    console.log(color, storage, size);
    $('#32gb').toggleClass('hidden', color == "jetblack");
    if (color == "jetblack" && storage == "32gb") {
        $('#storage').prop('selectedIndex', 0);
        return filter();
    }
}