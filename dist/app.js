'use strict';

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

var _ = require('lodash'),
    readline = require('readline');

///////////////////
// LODASH IMPORT //
///////////////////

// import all lodash functions to the main namespace, but isNaN not to cause conflicts
_.each(_.keys(_), function (k) {
  return global[k === 'isNaN' ? '_isNaN' : k] = _[k];
});

///////////////
// CONSTANTS //
///////////////

var DIRECTIONS = {
  n: [0, -1, 0],
  s: [0, 1, 0],
  e: [-1, 0, 0],
  w: [1, 0, 0],
  u: [0, 0, -1],
  d: [0, 0, 1]
};

/////////////
// HELPERS //
/////////////

function findDirection(world, dir) {
  var longName = arguments[2] === undefined ? false : arguments[2];

  var maybeDirection = find(world.commands, function (c) {
    return contains(first(c), dir);
  }),
      dirLetter = first(first(maybeDirection));

  if (maybeDirection && has(DIRECTIONS, dirLetter)) {
    return longName ? first(maybeDirection)[1] : dirLetter;
  }
}

function makeRoom(location) {
  return [location, null, compact([random(0, 2) === 0 ? 'sledge' : null, random(0, 2) === 0 ? 'ladder' : null, random(0, 2) === 0 ? 'gold' : null])];
}

function listToDescriptiveString(lst) {
  if (!lst) return;
  if (lst.length === 1) return first(lst);
  return dropRight(lst).join(', ') + ' and ' + last(lst);
}

function itemsToDescriptiveItems(items) {
  return map(items, function (i) {
    switch (i) {
      case 'sledge':
        return 'a sledge';
      case 'ladder':
        return 'a ladder';
      case 'gold':
        return 'some gold';
    }
  });
}

//////////////
// MESSAGES //
//////////////

function help() {
  return 'You need a sledge to dig rooms and ladders to go upwards.\nValid commands are: directions (north, south...), dig, take, drop, equip, inventory and look.\nAdditionally you can tag rooms with the \'name\' command and alias commands with \'alias\'.\nHave fun!"\n';
}

function welcome() {
  console.log('Welcome to the dungeon!\nGrab the sledge and make your way to room 1,1,5 for a non-existant prize!\n');
  console.log(help());
}

/////////////
// ACTIONS //
/////////////

function gotoRoom(direction, world) {
  var wantedRoom = zipWith(world.player.location, DIRECTIONS[direction], add),
      room = find(world.rooms, function (r) {
    return isEqual(first(r), world.player.location);
  });

  if (direction === 'u' && !contains(room[2], 'ladder')) {
    console.log('You can\'t go upwards without a ladder!');
  } else {
    if (find(world.rooms, function (r) {
      return isEqual(first(r), wantedRoom);
    })) {
      world.player.location = wantedRoom;
      look(world);
    } else {
      console.log('There\'s no exit in that direction!');
    }
  }

  return world;
}

function dig(world, _ref) {
  var _ref2 = _slicedToArray(_ref, 1);

  var direction = _ref2[0];

  var dir = undefined,
      dirLongName = undefined,
      wantedRoom = undefined;

  if (!direction) {
    console.log('Where do you want to dig?');
    return world;
  }
  if (!(dir = findDirection(world, direction))) {
    console.log('That is not a direction I recognize');
    return world;
  }
  if (!contains(world.player.inventory, 'sledge')) {
    console.log('With your bare hands?');
    return world;
  }

  dirLongName = findDirection(world, direction, true);
  wantedRoom = zipWith(world.player.location, DIRECTIONS[dir], add);

  if (find(world.rooms, function (r) {
    return isEqual(first(r), wantedRoom);
  })) {
    console.log('There is already an exit, there!');
    return world;
  }

  world.rooms.push(makeRoom(wantedRoom));
  console.log('There is now an exit ' + dirLongName + 'ward');
  return world;
}

function look(world) {
  var room = find(world.rooms, function (r) {
    return isEqual(first(r), world.player.location);
  }),
      itemsOnFloor = itemsToDescriptiveItems(room[2]),
      itemsOnFloorStr = isEmpty(itemsOnFloor) ? '' : itemsOnFloor.length === 1 ? itemsOnFloor[0] : listToDescriptiveString(itemsOnFloor),
      exits = chain(DIRECTIONS).map(function (d, kd) {
    return [kd, zipWith(d, first(room), add)];
  }).filter(function (r) {
    return find(world.rooms, function (rr) {
      return isEqual(first(rr), r[1]);
    });
  }).map(function (d) {
    return find(world.commands, function (c) {
      return contains(first(c), first(d));
    })[0][1];
  }).value(),
      exitsStr = isEmpty(exits) ? '' : exits.length === 1 ? 'There is one exit: ' + exits[0] + '.' : 'You can see the following exits: ' + listToDescriptiveString(exits) + '.';

  console.log((room[1] ? room[1] : 'Room at ' + world.player.location[0] + ', ' + world.player.location[1] + ', ' + world.player.location[2]) + '\n' + (!itemsOnFloorStr ? '' : 'On the floor you can see ' + itemsOnFloorStr + '.\n') + exitsStr);

  return world;
}

function inventory(world) {
  if (world.player.inventory.length === 0) {
    console.log('You are not carrying anything');
  } else {
    console.log('You are carrying: ' + listToDescriptiveString(itemsToDescriptiveItems(world.player.inventory)));
  }

  return world;
}

function take(world, _ref3) {
  var _ref32 = _slicedToArray(_ref3, 1);

  var item = _ref32[0];

  var room = find(world.rooms, function (r) {
    return isEqual(first(r), world.player.location);
  });

  if (!item) {
    console.log('Take what?');
    return world;
  }

  if (item === 'all') {
    if (isEmpty(room[2])) {
      console.log('There is nothing to take here');
    } else {
      world.player.inventory = uniq(world.player.inventory.concat(room[2] || []));
      room[2] = [];
      console.log('All items taken');
    }
    return world;
  }

  if (!contains(room[2], item)) {
    console.log('You can\'t see anything like that here');
    return world;
  }

  world.player.inventory = uniq(world.player.inventory.concat([item]));
  pull(room[2], item);
  console.log('Taken');

  return world;
}

function drop(world, _ref4) {
  var _ref42 = _slicedToArray(_ref4, 1);

  var item = _ref42[0];

  var room = find(world.rooms, function (r) {
    return isEqual(first(r), world.player.location);
  });

  if (!item) {
    console.log('Drop what?');
    return world;
  }

  if (item === 'all') {
    if (isEmpty(world.player.inventory)) {
      console.log('You have nothing to drop');
    } else {
      room[2] = uniq(room[2].concat(world.player.inventory || []));
      world.player.inventory = [];
      console.log('All items dropped');
    }
    return world;
  }

  if (!contains(world.player.inventory, item)) {
    console.log('You don\'t have that item');
    return world;
  }

  room[2] = uniq(room[2].concat([item]));
  pull(world.player.inventory, item);
  console.log('Dropped');

  return world;
}

function equip(world, _ref5) {
  var _ref52 = _slicedToArray(_ref5, 1);

  var item = _ref52[0];

  if (!item) {
    console.log('What do you want to equip?');
    return world;
  }
  if (!contains(world.player.inventory, item)) {
    console.log('You don\'t have such object');
    return world;
  }

  world.player.equipped = item;
  console.log('Item equipped!');
  return world;
}

function unequip(world, _ref6) {
  var _ref62 = _slicedToArray(_ref6, 1);

  var item = _ref62[0];

  if (!item) {
    console.log('What do you want to unequip?');
    return world;
  }
  if (item !== world.player.equipped) {
    console.log('You don\'t have it equipped');
    return world;
  }

  world.player.equipped = null;
  console.log('Item unequipped!');
  return world;
}

function alias(world, _ref7) {
  var _ref72 = _slicedToArray(_ref7, 2);

  var cmd = _ref72[0];
  var al = _ref72[1];

  var foundCommand = undefined;

  if (!cmd && !al) {
    console.log('Aliases:' + chain(world.commands).filter(function (c) {
      return first(c).length > 1;
    }).map(first).reduce(function (acc, c) {
      return '' + acc + '\n' + first(c) + ' => ' + rest(c).join(', ');
    }, '').value());
    return world;
  }

  if (!(foundCommand = find(world.commands, function (c) {
    return contains(first(c), cmd);
  }))) {
    console.log('There is no such command');
    return world;
  }

  if (!al) {
    var aliases = reject(first(foundCommand), function (c) {
      return c === cmd;
    });

    if (isEmpty(aliases)) {
      console.log('There are no aliases for ' + cmd);
    } else {
      console.log('Aliases for "' + cmd + '":  ' + aliases.join(', '));
    }

    return world;
  }

  foundCommand[0] = uniq(first(foundCommand).concat([al]));
  console.log('Alias assigned');
  return world;
}

//////////////////////
// INPUT PROCESSING //
//////////////////////

function processInput(input, world) {
  var splitInput = trim(input).split(/\s+/g);var command = first(splitInput);

  var options = rest(splitInput);
  var commandFn = find(world.commands, function (c) {
    return contains(first(c), command.toLowerCase());
  });

  if (commandFn) {
    return commandFn[1](world, options);
  } else {
    console.log('I don\'t know what you mean.');
    return world;
  }
}

///////////////
// MAIN LOOP //
///////////////

(function runGame() {
  var world = {
    rooms: [[[0, 0, 0], 'The room where it all started...', ['ladder', 'sledge']], [[1, 1, 5], 'You found it! Lots of gold!']],
    commands: [[['n', 'north'], partial(gotoRoom, 'n')], [['s', 'south'], partial(gotoRoom, 's')], [['w', 'west'], partial(gotoRoom, 'w')], [['e', 'east'], partial(gotoRoom, 'e')], [['d', 'down'], partial(gotoRoom, 'd')], [['u', 'up'], partial(gotoRoom, 'u')], [['help'], help], [['dig'], dig], [['l', 'look'], look], [['i', 'inventory'], inventory], [['take'], take], [['drop'], drop], [['equip'], equip], [['unequip'], unequip], [['alias'], alias]],
    player: {
      location: [0, 0, 0],
      inventory: ['sledge'],
      equipped: null
    }
  };

  welcome();

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', function (input) {
    return world = processInput(input, world);
  });
})();
//# sourceMappingURL=app.js.map