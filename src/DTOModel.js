(function(factory) {
    if (typeof require === 'function' && typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else if (typeof define === 'function') {
        define(factory);
    } else {
        _.set(this, 'ru.etaranov.DTOModel', factory());
    }
}(function () {
    var DTOModel = function (attributes) {
        var attrs = attributes || {};
        attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
        this.set(attrs, true);
        this.initialize.apply(this, arguments);
    };

    DTOModel.extend = function (protoProps, staticProps) {
        var parent = this;
        var child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent constructor.
        if (protoProps && _.has(protoProps, 'constructor')) {
            child = protoProps.constructor;
        } else {
            child = function () {
                return DTOModel.prototype.constructor.apply(this, arguments);
            };
        }

        // Add static properties to the constructor function, if supplied.
        _.assign(child, parent, staticProps);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent` constructor function.
        var Surrogate = function () {
            this.constructor = child;
        };
        Surrogate.prototype = parent.prototype;
        child.prototype     = new Surrogate();

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) _.extend(child.prototype, protoProps);


        // add caching map
        if (staticProps && staticProps.$options && staticProps.$options.singletone) {
            child._instaces = {};
        }

        return child;
    };

    DTOModel.equals = function (a, b) {
        return JSON.stringify(a.toJSON()) === JSON.stringify(b.toJSON());
    };

    /**
     * @param attributes {Object}
     * @param [merge] {Boolean} true to not reset missing attributes
     */
    DTOModel.prototype.set = function (attributes, merge) {
        var self = this;

        if (merge) {
            _.forOwn(attributes, function (_value, _key) {
                self[ _key ] = attributes[ _key ];
            });
        }

        else {
            _.forOwn(self.defaults, function (_defaultValue, _key) {
                self[ _key ] = attributes[ _key ] !== undefined ? attributes[ _key ] : _defaultValue;
            });
        }
    };

    DTOModel.prototype.constructor = function (attributes) {
        if (this.constructor.$options && this.constructor.$options.singletone) {

            // merge with cached if we have to
            if (this.constructor._instaces[attributes[this._idAttribute]]) {
                return this.constructor._instaces[attributes[this._idAttribute]].set(attributes);
            }

            // otherwise make new and add to cache
            else {
                DTOModel.apply(this, arguments);
                this.constructor._instaces[attributes[this._idAttribute]] = this;
                return this;
            }
        }

        // no cache used
        return DTOModel.apply(this, arguments);
    };

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    DTOModel.prototype.initialize = function () {};

    // Return a model's attributes described in "defaults" block.
    DTOModel.prototype.toJSON = function () {
        var self = this;
        var json = {};

        _.keys(this.defaults)
            .forEach(function (key) {
                if (self[key]) {
                    json[key] = self[key];
                }
            });

        return json;
    };

    /**
     * Deep clone of model
     */
    DTOModel.prototype.getSnapshot = function () {
        return JSON.parse(JSON.stringify(this.toJSON()));
    };

    return DTOModel;
}));