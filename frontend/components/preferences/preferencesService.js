angular.module('preferences').factory('preferences', ['$q', '$location', function ($q, $location) {

    return {
        set: function (key, value) {
            localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
        },

        get: function (key) {
            var data = localStorage.getItem(key);

            if (data && typeof data === 'string' && (data[0] === '[' || data[0] === '{')) {
                data = JSON.parse(data, function(k, v) {
                    return (typeof v === "object" || isNaN(v)) ? v : parseInt(v, 10);
                });
            }

            if(key === 'user' && !data){
                $location.path('login');
            }

            return data === 'true' || (data === 'false' ? false : data);
        },

        remove: function (key) {
            localStorage.removeItem(key);
        },

        clear: function() {
            localStorage.clear();
        }
    };
}]);
