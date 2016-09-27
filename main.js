$.getJSON("models.json", {}, function(data) {
    var models = {};
    $.each(data, function() {
        models[this['part_number']] = this;
    });
    window.models = models;
    // console.log(models);
});
var filter;
$(document).ready(function() {
    // load model data
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
    });

    function loadData(initial) {
        $.getJSON("api/index.php", {
            do: 'availability'
        }, function(data) {
            // update last-update
            if (window.last_update == data['updated']) {
                return;
            } else {
                window.last_update = data['updated'];
                if (window.fast_refresh) {
                    clearInterval(window.fast_refresh);
                    window.fast_refresh = false;
                }
            }
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
                    if (!store.storeEnabled) console.warn("Store", store.storeNumber, store, store.storeName, "not enabled!");
                    // console.log(store.storeName, v);
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
            $table.find('tfoot tr#time-slot td').remove();
            $.each(model_obj, function(k, v) {
                // console.log(k, v);
                if (k.length !== 9) return timeSlot = v;
                var name = k;
                var model;
                if (window.models) {
                    try {
                        model = window.models[name];
                        name = window.models[name]['productDescription'];
                    } catch (err) {
                        console.info(name, err);
                    }
                }
                $table.find('tbody').append('<tr id="' + k + '"><td class="model">' + name + '</td></tr>');
                var contents = [];
                $.each(headers, function(kk, vv) {
                    contents[kk] = v[vv];
                });
                // console.log(contents);
                var $row = $table.find('tbody tr#' + CSS.escape(k));
                $row.data(model);
                $.each(contents, function(index) {
                    var icon = '<a target="_blank" href="https://reserve-hk.apple.com/HK/zh_HK/reserve/iPhone?channel=1&iPP=false&store=' + headers[index] + '&partNumber=' + k + '">';
                    var status = this.trim().toLowerCase();
                    switch (status) {
                        case 'none':
                            icon += '<i class="fa fa-times text-danger"></i>';
                            break;
                        case 'all':
                            icon += '<i class="fa fa-check text-success"></i>';
                            $row.addClass('available');
                            break;
                        default:
                            icon += '<span class="text-warning">' + status + '</span>';
                    }
                    icon += '</a>';
                    $row.append('<td>' + icon + '</td>');
                });
            })
            var $timeSlotRow = $table.find('tfoot tr#time-slot').append('<td>Available Time</td>');
            var timeSlotSorted = [];
            $.each(headers, function(k, v) {
                timeSlotSorted[k] = timeSlot[v];
            });
            $.each(timeSlotSorted, function(k, v) {
                var time = v ? (v['en_HK'] ? v['en_HK']['timeslotTime'] : 'N/A') : 'N/A';
                $timeSlotRow.append('<td>' + time + '</td>');
            });
            // filter
            if (!initial) filter();
            if (initial) updateTime(true);
        });
    }

    function updateTime(initial) {
        var sec_elapsed = Math.round((new Date() - new Date(window.last_update)) / 1000);
        var sec_to_target = (350 - sec_elapsed) > 0 ? (350 - sec_elapsed) : 0; // 10s if passed target
        if (initial) {
            $("#last-update").parents('.panel').removeClass('hidden');
        }
        if (!window.fast_refresh) {
            window.fast_refresh = true;
            setTimeout(function() {
                window.fast_refresh = setInterval(loadData, 5000);
            }, sec_to_target * 1000);
        }
        var hours = Math.floor(sec_elapsed / 3600);
        var minutes = Math.floor((sec_elapsed - (hours * 3600)) / 60);
        var seconds = sec_elapsed - (hours * 3600) - (minutes * 60);
        if (hours > 0) {
            hours += " hours ";
        } else {
            hours = "";
        }
        if (minutes > 0 || hours.length > 0) {
            minutes += " minutes ";
        } else {
            minutes = "";
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        $("#last-update").text(hours + minutes + seconds + " seconds");
        return setTimeout(updateTime, 100);
    }
    filter = function filter() {
        var color = $('#color').val().trim().toLowerCase();
        var capacity = $('#capacity').val().trim().toLowerCase();
        var sub = $('#sub').val();
        // console.log(color, capacity, sub);
        $('#32gb').toggleClass('hidden', color == "jet black");
        if (color == "jet black" && capacity == "32gb") {
            $('#capacity').prop('selectedIndex', 0);
            return filter();
        }
        // do filtering
        $('table.availability tbody tr').each(function() {
            var this_data = $(this).data(),
                this_color = this_data['color'].toLowerCase();
            this_capacity = this_data['capacity'].toLowerCase();
            this_sub = this_data['subfamily_id'];
            // filter color
            if ((color && color != this_color) || (capacity && capacity != this_capacity) || (sub && sub != this_sub)) {
                $(this).addClass('hidden');
            } else {
                $(this).removeClass('hidden');
            }
        });
    }
});
