const test = require('ava');

const Mask = require('../lib/Mask');
const Domain = require('../lib/Domain');

class Thing extends Domain {
    get props() {
        return {
            name: String,
            description: String,
            size: Number,
            physical: Boolean
        };
    }
}

test('assign, touched & schema', t => {
    const mask = Mask.cover(Thing).with({
        size: true,
        physical: true
    });

    const name = 'Shoes';
    const description = 'Adventure Playground';
    const physical = true;

    const thing = new Thing({name, size: 'ignored', physical: 'ignored'})
    const touched = mask.settle(
        thing,
        new Thing({name: 'overriden', description, physical})
    );

    t.is(thing.name, name);
    t.is(thing.description, undefined);
    t.is(thing.size, undefined);
    t.is(thing.physical, physical);

    t.true(touched.name);
    t.true(touched.description);
    t.is(touched.size, undefined);
    t.is(touched.physical, undefined);
});

class Gift extends Domain {
    get props() {
        return {
            names: [String]
        };
    }
}

test('assign array, touched (less)', t => {
    const mask = Mask.cover(Gift);

    const names = ['Shoes', 'Shirt', 'Jeans'];

    const gift = new Gift({names});
    const touched = mask.settle(
        gift,
        new Gift({names: ['Jeans', 'Shirt']})
    );

    t.deepEqual(gift.names, ['Shoes', 'Shirt', 'Jeans']);
    t.deepEqual(touched.names, [true, false, true]);
});

test('assign array, touched (more)', t => {
    const mask = Mask.cover(Gift);

    const names = ['Shoes', 'Shirt'];

    const gift = new Gift({names});
    const touched = mask.settle(
        gift,
        new Gift({names: ['Jeans', 'Shirt', 'Jeans']})
    );

    t.deepEqual(gift.names, ['Shoes', 'Shirt']);
    t.deepEqual(touched.names, [true, false]);
});

test('assign array, touched & schema', t => {
    const mask = Mask.cover(Gift).with({
        names: true
    });

    const names = ['Shoes', 'Shirt', 'Jeans'];

    const gift = new Gift({names});
    const touched = mask.settle(
        gift,
        new Gift({names: ['Jeans', 'Shirt']})
    );

    t.deepEqual(gift.names, ['Jeans', 'Shirt']);
    t.is(touched.names, undefined);
});

class Box extends Domain {
    get props() {
        return {
            thing: Thing
        };
    }
}

test('assign deep, touched & schema', t => {
    const mask = Mask.cover(Box).with({
        thing: {
            physical: true
        }
    });

    const name = 'Shoes';
    const size = 40;
    const description = 'Adventure Playground';
    const physical = true;

    const box = new Box({thing: {name, description, size, physical: 'ignored'}});
    const touched = mask.settle(
        box,
        new Box({thing: {name: 'overriden', description, physical}})
    );

    t.is(box.thing.name, name);
    t.is(box.thing.description, description);
    t.is(box.thing.size, size);
    t.is(box.thing.physical, physical);

    t.true(touched.thing.name);
    t.is(touched.thing.description, undefined);
    t.true(touched.thing.size);
    t.is(touched.thing.physical, undefined);
});

test('assign empty deep, touched & schema', t => {
    const mask = Mask.cover(Box).with({
        thing: {
            physical: true
        }
    });

    const physical = true;

    const box = new Box();
    const touched = mask.settle(
        box,
        new Box({thing: {physical}})
    );

    t.is(box.thing.name, undefined);
    t.is(box.thing.description, undefined);
    t.is(box.thing.size, undefined);
    t.is(box.thing.physical, physical);

    t.is(touched.thing, undefined);
});

test('assign empty root deep, touched & schema', t => {
    const mask = Mask.cover(Box).with({
        thing: true
    });

    const physical = true;

    const box = new Box();
    const touched = mask.settle(
        box,
        new Box({thing: {physical}})
    );

    t.is(box.thing.name, undefined);
    t.is(box.thing.description, undefined);
    t.is(box.thing.size, undefined);
    t.is(box.thing.physical, physical);
    t.true(box.thing instanceof Thing);

    t.is(touched.thing, undefined);
});

class UnreferencedBox extends Domain {
    get props() {
        return {
            thing: Object
        };
    }
}

test('assign empty class tree, touched & schema', t => {
    const mask = Mask.cover(UnreferencedBox).with({
        thing: {
            name: true
        }
    });

    const name = 'Shoes';

    const box = new UnreferencedBox();
    const touched = mask.settle(
        box,
        new UnreferencedBox({thing: {name}})
    );

    t.is(box.thing.name, name);
    t.is(box.thing.size, undefined);

    t.is(touched.thing, undefined);
});

class Boxes extends Domain {
    get props() {
        return {
            things: [Thing]
        };
    }
}

test('assign deep array, touched', t => {
    const mask = Mask.cover(Boxes).with({
        things: [{
            physical: true
        }]
    });

    const name = 'Shoes';
    const description = 'Adventure Playground';
    const physical = true;

    const boxes = new Boxes({things: [{name, description, physical: 'ignored'}, {name, description, physical: 'ignored'}]});
    const touched = mask.settle(
        boxes,
        new Boxes({things: [{name: 'overriden', description, physical}, {name: 'overriden', description, physical}]})
    );

    for (let i = 0; i < 2; i++) {
        t.is(boxes.things[i].name, name);
        t.is(boxes.things[i].description, description);
        t.is(boxes.things[i].size, undefined);
        t.is(boxes.things[i].physical, physical);
    }

    t.is(touched.things.length, 2);

    for (let i = 0; i < 2; i++) {
        t.true(touched.things[i].name);
        t.is(touched.things[i].description, undefined);
        t.is(touched.things[i].size, undefined);
        t.is(touched.things[i].physical, undefined);
    }
});

class UnreferencedBoxes extends Domain {
    get props() {
        return {
            things: [{
                name: String,
                size: Boolean,
                details: {
                    more: Boolean,
                    less: Boolean
                }
            }]
        };
    }
}

test('assign class tree array, touched & schema', t => {
    const mask = Mask.cover(UnreferencedBoxes).with({
        things: [{
            size: true,
            details: {
                less: true
            }
        }]
    });

    const name = 'Shoes';

    const boxes = new UnreferencedBoxes({things: [{name, size: 'ignored', details: {more: true, less: true}}, {name, size: 'ignored', details: {more: true, less: true}}]});
    const touched = mask.settle(
        boxes,
        new UnreferencedBoxes({things: [{name: 'overriden', details: {more: false, less: false}}, {name: 'overriden', details: {more: false, less: false}}]})
    );

    for (let i = 0; i < 2; i++) {
        t.is(boxes.things[i].name, name);
        t.is(boxes.things[i].size, undefined);
        t.true(boxes.things[i].details.more);
        t.false(boxes.things[i].details.less);
    }

    t.is(touched.things.length, 2);

    for (let i = 0; i < 2; i++) {
        t.true(touched.things[i].name);
        t.is(touched.things[i].size, undefined);
        t.true(touched.things[i].details.more);
        t.is(touched.things[i].details.less, undefined);
    }
});