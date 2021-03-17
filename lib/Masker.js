class Mask {
    constructor(Clazz) {
        this.Clazz = Clazz;
    }
    with(schema) {
        this.schema = schema;
        return this;
    }
    settle(destination, source) {
        const props = this._props(this.Clazz);
        const untouched = this._settleObject(destination, source, props, this.schema);
        return untouched === undefined ? {} : untouched;
    }
    _settleObject(destination, source, props, layer) {
        const touched = {};
        let untouched = true;

        Object.keys(props).forEach(prop => {
            const settled = this._settleValue(destination, source, prop, props[prop], layer);
            if (settled.hasOwnProperty('value')) {
                destination[prop] = settled.value;
            }
            if (settled.hasOwnProperty('touched')) {
                touched[prop] = settled.touched;
                untouched = false;
            }
        });

        return untouched ? undefined : touched;
    }
    _settleValue(destination, source, prop, Type, layer) {
        layer = layer || {};
        layer = layer.length ? layer[0] : layer;
        if (Array.isArray(Type)) {
            return this._settleArrayValue(destination, source, prop, Type, layer);
        }

        const settled = {};

        destination = destination || {};
        source = source || {};

        switch (Type) {
            case Boolean:
            case String:
            case Number:
            case Date:
                if (this._isLayered(layer, prop)) {
                    settled.value = source[prop];
                } else if (destination[prop] !== source[prop]) {
                    settled.touched = true;
                }
                break;
            default:
                if (this._isLayered(layer, prop) && !destination[prop]) {
                    destination[prop] = this._isClass(Type) ? new Type() : {};
                }

                if (this._isNotLiteral(Type) && this._isClass(Type)) {
                    const props = this._isClass(Type) ? this._props(Type) : Type;
                    const touched = this._settleObject(destination[prop], source[prop], props, this._isLayered(layer, prop));
                    if (touched) {
                        settled.touched = touched;
                    }
                } else {
                    const props = this._literalProps(Type, destination, source, prop);

                    Object.keys(props).forEach(subprop => {
                        const settledItem = this._settleValue(destination[prop], source[prop], subprop, props[subprop], this._isLayered(layer, prop));
                        if (!settled.value) {
                            settled.value = {};
                        }
                        if (settledItem.hasOwnProperty('value')) {
                            settled.value[subprop] = settledItem.value;
                        } else {
                            const subdestination = destination[prop] || {};
                            settled.value[subprop] = subdestination[subprop];
                        }
                        if (settledItem.hasOwnProperty('touched')) {
                            if (!settled.touched) {
                                settled.touched = {};
                            }
                            settled.touched[subprop] = settledItem.touched;
                        }
                    });
                }
        }
        return settled;
    }
    _settleArrayValue(destination, source, prop, Type, layer) {
        const destinationItems = destination[prop] || [];
        const sourceItems = source[prop] || [];

        const length = this._isLayered(layer, prop) ? sourceItems.length : destinationItems.length;

        const settled = {touched: []};
        let untouched = true;

        for (let index = 0; index < length; index++) {
            const settledItem = this._settleValue({[prop]: destinationItems[index]}, {[prop]: sourceItems[index]}, prop, Type[0], layer);
            if (settledItem.hasOwnProperty('value')) {
                if (!settled.value) {
                    settled.value = [];
                }
                settled.value.push(settledItem.value);
            }
            if (settledItem.hasOwnProperty('touched')) {
                settled.touched.push(settledItem.touched);
                untouched = false;
            } else {
                settled.touched.push(false);
            }
        }
        if (untouched) {
            delete settled.touched;
        }

        return settled;
    }
    _isLayered(layer, prop) {
        return layer === true || layer[prop];
    }
    _isClass(object) {
        return !!object.prototype && !!object.prototype.constructor.name;
    }
    _props(Type) {
        return Type.prototype.props || {};
    }
    _isNotLiteral(object) {
        return object !== Object;
    }
    _literalProps(Type, destination, source, prop) {
        if (Type !== Object) {
            return Type;
        }
        
        const props = new Set();
        if (destination && destination[prop]) {
            Object.keys(destination[prop]).forEach(prop => props.add(prop));
        }
        if (source && source[prop]) {
            Object.keys(source[prop]).forEach(prop => props.add(prop));
        }
        return Array.from(props.keys()).reduce((memo, key) => {
            memo[key] = String; // String has no particular meaning, key will be handled as primitive (deep types not supported)
            return memo;
        }, {});
    }
}

module.exports = Mask;