import("https://baicoianu.com/~bai/doom/doomclient.js").then(() => {
room.registerElement('doom-wordle', {
  wordlisturl: 'words.txt',
  answerlisturl: 'answers.txt',
  create() {
    document.body.addEventListener('mousedown', ev => this.enableSound(ev));
    document.body.addEventListener('touchstart', ev => this.enableSound(ev));
    fetch(this.wordlisturl).then(res => res.text()).then(words => {
      this.validwords = words.split('\n');
      fetch(this.answerlisturl).then(res => res.text()).then(answers => {
        this.answerwords = answers.split('\n');
        document.fonts.load('10px Doom').then(() => {
          if (room.pendingCustomElements == 0) {
            this.loadWAD();
          } else {
            elation.events.add(room, 'room_load_complete_customelements', ev => this.loadWAD());
          }
        });
      });
    });
  },
  async loadWAD() {
    this.iwad = new WadJS.WadGroup();
    await this.iwad.load('../DOOM.WAD');

    this.loadTexture('gray4');
    this.loadTexture('skinmet1');
    this.loadTexture('skintek1');
    this.loadTexture('skintek2');
    this.loadTexture('starg3');
    this.loadTexture('sw1exit');
    this.loadTexture('marbface');
    this.loadTexture('lite5');
    this.loadTexture('support3');
    this.loadTexture('comptile');
    this.loadTexture('compblue');
    this.loadTexture('shawn2');
    this.loadTexture('sw1brn2');
    this.loadTexture('sw2brn2');

    this.loadTexture('starg1');
    this.loadTexture('stargr1');
    this.loadTexture('startan1');

    this.iwad.getSounds();
/*
    this.collection = elation.elements.create('collection-jsonapi', {
      endpoint: 'wadlist-flat4.json',
    });
    this.list = this.createObject('doom-scroll-list', {
      collection: this.collection
    });
*/
    this.doomplayer = this.createObject('doomplayer', {wad: this.iwad, map: { wad: this.iwad }, /*collision_id: 'sphere', collision_scale: V(24),*/ autosync: true, js_id: player.getUsername() + '_avatar'});
    let length = 500,
        aspect = 2,
        scale = 15,
        repeaty = 2000;
    //this.backdrop = this.createObject('object', { id: 'plane', image_id: 'skintek1', pos: V(0, -(scale * (repeaty - 3)) / 2, -4.5), scale: V(scale * 3, scale * repeaty), texture_repeat: V(3, repeaty * aspect), pickable: false, collidable: false, });
    this.environment = this.createRandomRoom();

    this.layout = this.createObject('layout-template', { transitioneasing: 'ease-out-elastic', transitiontime: 750 });
    let masterlayout = this.layout.createObject('layout-master');
    let gameslot = masterlayout.createObject('layout-slot', { slotname: 'gameslot', pos: V(-.6, 2.5, 0) });
    let keyboardslot = masterlayout.createObject('layout-slot', { slotname: 'keyboardslot', pos: V(-.65, .8, 0) });

    this.logo = this.createObject('object', {
      js_id: 'doomle_logo',
      id: 'plane',
      image_id: 'doomle',
      scale: V(1.569, .392, 1),
      pos: V(0, 2.8, 0)
    })
    this.face = this.createObject('doom-wordle-face', {
      js_id: 'doomle_hud',
      pos: V(-.08, 2.8, .02),
      wad: this.iwad,
      scale: V(.385),
    })

    this.guesses = [
      gameslot.createObject('doom-wordle-guess', { pos: V(0, 0, 0) }),
      gameslot.createObject('doom-wordle-guess', { pos: V(0, -.3, 0) }),
      gameslot.createObject('doom-wordle-guess', { pos: V(0, -.6, 0) }),
      gameslot.createObject('doom-wordle-guess', { pos: V(0, -.9, 0) }),
      gameslot.createObject('doom-wordle-guess', { pos: V(0, -1.2, 0) }),
      gameslot.createObject('doom-wordle-guess', { pos: V(0, -1.5, 0) }),
    ];
//console.log('my guesses', this.guesses);
    this.currentguess = gameslot.createObject('doom-wordle-indicator');

    this.keyboard = keyboardslot.createObject('doom-wordle-keyboard', {
      //pos: V(-.65, .8, 0),
      scale: V(.5),
    });

    let horizontallayout = this.layout.createObject('layout-alternate', { layoutname: 'horizontal' });
    horizontallayout.createObject('layout-slot', { slotname: 'gameslot', pos: V(-2.4, 2.3, .3), scale: V(1) });
    horizontallayout.createObject('layout-slot', { slotname: 'keyboardslot', pos: V(-.7, 2.25, .3), scale: V(2.8) });

    this.currentword = this.getWord();

    document.body.addEventListener('keydown', ev => this.handleKeyDown(ev));
    this.keyboard.addEventListener('keydown', ev => this.handleKeyDown(ev));
    //this.list.addEventListener('itemselect', ev => this.showInfo(ev.target));
screen.orientation.addEventListener('change', ev => this.handleOrientationChange(ev))

    this.transition = player.createObject('doomtransition', { js_id: 'transition', speed: .01 });
    this.transition.reset();
    this.transition.begin();

  },
  loadTexture(name) {
    let tex = this.iwad.getTexture(name);
    this.loadNewAsset('image', { id: name, canvas: tex.canvas, tex_linear: false,});
//console.log('did tex', name, tex);
    return tex;
  },
  showInfo(item) {
    this.infobox.show(item);
  },
  hideInfo() {
    this.infobox.hide();
  },
  handleKeyDown(ev) {
    this.enableSound();
    let key = ev.data || ev.key;
    let guess = this.guesses[this.currentguess.num];
    if (key >= 'a' && key <= 'z' && !ev.ctrlKey && !ev.altKey) {
      if (guess.addLetter(key)) {
        this.playSound('dspistol');
      } else {
        this.playSound('dsnoway');
      }
      //this.level.playSound('DSPSTOP', 100, V(0));
    } else if (key == 'Backspace' || key == '⌫') {
//console.log(ev);
      if (guess.removeLetter()) {
        this.playSound('dsstnmov');
      } else {
        this.playSound('dsnoway');
      }
    } else if (key == 'Enter' || key == '↵') {
      if (this.won || this.lost) {
        this.reset();
      } else {
        if (guess.current == guess.letters) {
          let result = this.testGuess();
  //console.log('my result', result);
          this.playSound('dsswtchn');
          if (result == 'success') {
            //alert('you win!');
            guess.wiggle(0, 2, 0);
            this.playSound('dsgetpow');
            this.won = true;
            if (this.currentguess.num == 0) {
              this.face.invulnerable = true;
              this.face.setHealth(200);
            } else {
              this.face.grinning = true;
              this.face.updateFace();
            }
          } else if (result == 'failed') {
    //console.log(this.currentguess.num, this.guesses.length-1);
            if (this.currentguess.num < this.guesses.length-1) {
              this.currentguess.num++;
              guess.wiggle(0, 0, 2);
              this.playSound('dsclaw');
              this.playSound('dsplpain');
              this.face.hurt();
              this.face.setHealth((100 / this.guesses.length) * (this.guesses.length - this.currentguess.num));
            } else {
              console.log('ur ded');
              this.lost = true;
              this.face.setHealth(0);
              let keystats = this.keyboard.getStats();
              if (keystats.found > 0) {
                this.playSound('dspldeth');
              } else if (keystats.misplaced > 0) {
                this.playSound('dspdiehi');
              } else {
                this.playSound('dsbarexp');
                this.playSound('dsslop');
              }
            }
          } else if (result == 'invalid') {
            console.log('invalid word');
            guess.wiggle(2, 0, 0);
            this.playSound('dspstop');
          }
        } else {
          this.playSound('dsnoway');
        }
      }
    }
  },
  getWord() {
    return this.answerwords[Math.floor(Math.random() * this.answerwords.length)]
  },
  reset() {
    this.transition.reset();
    if (this.environment) this.environment.die();
    this.environment = this.createRandomRoom();
    this.currentword = this.getWord();
    this.playSound('dssgcock');
    this.keyboard.reset();
    for (let i = 0; i < this.guesses.length; i++) {
      this.guesses[i].reset();
    }
    this.currentguess.num = 0;
    this.face.reset();
    this.won = false;
    this.lost = false;
    this.transition.begin();
  },
  testGuess() {
    let guess = this.guesses[this.currentguess.num],
        word = this.currentword;

    let guessedword = guess.getWord();
    if (this.validwords.indexOf(guessedword) == -1) {
      return 'invalid';
    }

    let seen = {};

    let success = true;

/*
    for (let i = 0; i < guess.letters; i++) {
      let slot = guess.slots[i],
          letter = slot.letter;
      let idx = word.indexOf(letter, seen[letter]);
      
      if (word[i] == letter) {
        slot.setState('found');
        seen[letter] = idx+1;
        success = success && true;
        this.keyboard.markFound(letter);
      } else if (idx != -1) {
        slot.setState('misplaced');
        seen[letter] = idx+1;
        success = false;
        this.keyboard.markMisplaced(letter);
      } else {
        slot.setState('notfound');
        success = false;
        this.keyboard.markNotFound(letter);
      }
    }
*/
    let letters = word.split('');
    // first, mark found letters
    for (let i = 0; i < guess.letters; i++) {
      let slot = guess.slots[i],
          letter = slot.letter;
      let idx = letters.indexOf(letter, seen[letter]);
      if (letters[i] == letter) {
console.log('found:', i, letter);
        slot.setState('found');
        letters[i] = null;
        //seen[letter] = idx+1;
        this.keyboard.markFound(letter);
      }
    }
console.log('aaaa', letters, seen);
    // next, find misplaced and not-found letters
    for (let i = 0; i < guess.letters; i++) {
      let slot = guess.slots[i],
          letter = slot.letter;
      let idx = letters.indexOf(letter, seen[letter]);
console.log('check?', letter, idx, letters, seen)
      
      if (!letters[i]) continue;
      if (idx != -1) {
        slot.setState('misplaced');
        seen[letter] = idx+1;
        //letters[i] = null;
        success = false;
        this.keyboard.markMisplaced(letter);
      } else if (letters[i]) {
        slot.setState('notfound');
        success = false;
        this.keyboard.markNotFound(letter);
      }
    }

    return (success ? 'success' : 'failed');
  },
  handleOrientationChange(ev) {
//console.log('!!!!', ev);
    if (!(this.layout && this.layout.layouts.default && this.layout.layouts.horizontal)) return;
    if (window.innerWidth / window.innerHeight >= 1.2) {
      if (this.layout.current != 'horizontal') {
        this.layout.setLayout('horizontal');
        this.playSound('dsbdopn');
      }
    } else {
      if (this.layout.current != 'default') {
        this.layout.setLayout('default');
        this.playSound('dsbdcls');
      }
    }
  },
  async playSound(name, reverse=false) {
    let sound = this.iwad.getSound(name);
    let audionodes = await room.getAudioNodes();
    let listener = audionodes.listener;
    let audio = listener.context;
    var buffer = audio.createBuffer(1, sound.samples, sound.rate);
    if (reverse) {
      buffer.getChannelData(0).set([...sound.pcm].reverse());
    } else {
      buffer.getChannelData(0).set(sound.pcm);
    }

    var source = audio.createBufferSource();
    source.buffer = buffer;
    source.connect(audio.destination);
    source.start(0);
  },
  enableSound() {
    if (!janus.engine.systems.sound.canPlaySound) {
      janus.engine.systems.sound.enableSound();
    }
  },
  createRandomRoom() {
    let walltextures = ['ashwall', 'brown1', 'brown144', 'brown96', 'browngrn', 'brownhug', 'brownpip', 'comptile', 'compute3', 'gray4', 'gray5', 'gray7', 'starg3', 'startan2', 'startan3', 'stone', 'stone2', 'stone3', 'tekwall1', 'tekwall2', 'tekwall3', 'tekwall4', 'tekwall5', 'nukedge1', 'cement1', 'cement2', 'cement3', 'cement4', 'cement5', 'cement6', 'firemag1', 'firemag2', 'firemag3', 'gstone1', 'gstone2', 'skinlow', 'skinmet1', 'skinmet2', 'skinsymb', 'starbr2', 'starg2', 'stargr2', ],
        floortextures = ['floor0_1', 'floor0_3', 'floor0_6', 'floor5_4', 'floor6_1', 'floor6_2', 'floor7_1', 'floor7_2', 'mflr8_1', 'floor4_8', 'floor5_1', 'floor5_2', 'floor5_3'],
        ceiltextures = ['floor0_1', 'floor0_3', 'floor0_6', 'floor5_4', 'floor6_1', 'floor6_2', 'floor7_1', 'floor7_2', 'mflr8_1', 'floor4_8', 'floor5_1', 'floor5_2', 'floor5_3'];


    let floortex = floortextures[Math.floor(Math.random() * floortextures.length)],
        ceiltex = ceiltextures[Math.floor(Math.random() * ceiltextures.length)],
        walltex = walltextures[Math.floor(Math.random() * walltextures.length)];

    let nuketextures = ['nukedge1'],
        lavatextures = ['firemag1', 'firemag2', 'firemag3'],
        bloodtextures = ['gstone2'];

    if (nuketextures.indexOf(walltex) != -1) floortex = 'nukage1';
    else if (lavatextures.indexOf(walltex) != -1) floortex = 'floor6_1';
    else if (bloodtextures.indexOf(walltex) != -1) floortex = 'blood1';

    let width = Math.floor(Math.random() * 10) + 5,
        height = Math.floor(Math.random() * 2) + 5,
        depth = Math.floor(Math.random() * 10) + 10;

    let floortexdef = this.loadTexture(floortex);
    let ceiltexdef = this.loadTexture(ceiltex);
    let walltexdef = this.loadTexture(walltex);

    let floortexaspect = floortexdef.canvas.width / floortexdef.canvas.height,
        ceiltexaspect = ceiltexdef.canvas.width / ceiltexdef.canvas.height,
        walltexaspect = walltexdef.canvas.width / walltexdef.canvas.height;

    let myroom = this.createObject('object');
    let walls = [
      myroom.createObject('object', {
        id: 'plane',
        image_id: walltex,
        pos: V(0, height / 2 - .5, -depth / 2),
        scale: V(width, height, 1)
      }),
      myroom.createObject('object', {
        id: 'plane',
        image_id: walltex,
        pos: V(0, height / 2 - .5, depth / 2),
        scale: V(width, height, 1),
        rotation: V(0, 180, 0),
        texture_repeat: V(1, 1)
      }),
      myroom.createObject('object', {
        id: 'plane',
        image_id: walltex,
        pos: V(-width / 2, height / 2 - .5, 0),
        scale: V(depth, height, 1),
        rotation: V(0, 90, 0),
        texture_repeat: V(width / 4, 1)
      }),
      myroom.createObject('object', {
        id: 'plane',
        image_id: walltex,
        pos: V(width / 2, height / 2 - .5, 0),
        scale: V(depth, height, 1),
        rotation: V(0, -90, 0)
      }),
    ];
    let ceil = myroom.createObject('object', { id: 'plane', image_id: ceiltex, pos: V(0, height - .5, 0), scale: V(width, depth, 1), rotation: V(90, 0, 0), texture_repeat: V(width / 2, depth / 2) });
    let floor = myroom.createObject('object', { id: 'plane', image_id: floortex, pos: V(0, -.5, 0), scale: V(width, depth, 1), rotation: V(-90, 0, 0) , texture_repeat: V(width / 2, depth / 2)});
    return myroom;
  }
});
room.registerElement('doom-wordle-guess', {
  letters: 5,

  create() {
    this.mass = 1;
    this.snappoint = this.localToWorld(V(0,0,0));
    this.snapanchor = this.parent.createObject('object', { pos: this.parent.worldToLocal(this.localToWorld(V(0, 0, 0))) });
    //this.snapforce = this.addForce('spring', { strength: 100, hard: true, anchor: this.snappoint });
    this.snapforce = this.addForce('spring', { strength: 100, hard: true, other: this.snapanchor.objects.dynamics });
    this.frictionforce = this.addForce('friction', 8);
    this.dragforce = this.addForce('drag', .5);

    this.slots = [];
    for (let i = 0; i < this.letters; i++) {
      this.slots[i] = this.createObject('doom-wordle-letter', {
        num: i,
        pos: V(i * .3, 0, 0),
      });
    }
    this.current = 0;
  },
  addLetter(letter) {
    if (this.current < this.slots.length) {
      this.slots[this.current].setLetter(letter);
      this.current++;
      this.wiggle(0, 0, -.5);
      return true;
    }
    return false;
  },
  removeLetter() {
    if (this.current > 0) {
      this.current--;
      this.slots[this.current].setLetter('');
      this.wiggle(-.5, 0, 0);
      return true;
    }
    return false;
  },
  getWord() {
    let word = '';
    for (let i = 0; i < this.letters; i++) {
      word += this.slots[i].letter;
    }
    return word;
  },
  wiggle(x=0, y=0, z=0) {
    //this.localToWorld(this.snappoint.set(0,0,0));
    this.vel.set(x, y, z)
  },
  reset() {
    this.current = 0;
    for (let i = 0; i < this.letters; i++) {
      this.slots[i].setState('unknown');
      this.slots[i].setLetter('');
    }
  },
});
room.registerElement('doom-wordle-letter', {
  num: 0,
  letter: '',
  state: 'unknown',
  clickable: false,

  create() {
    this.backdrop = this.createObject('object', {
      id: 'plane',
      image_id: 'stargr1',
      scale: V(.25, .25, .01),
      texture_offset: V(0, .112),
      texture_repeat: V(.5, .36),
      lighting: false,
      col: V(1),
      collision_id: (this.clickable ? 'cube' : null),
      collision_scale: V(1,1,.1),
    });
    if (this.clickable) {
      this.backdrop.addEventListener('click', ev => this.handleClick(ev));
      this.backdrop.addEventListener('mousedown', ev => this.handleMouseDown(ev));
      this.backdrop.addEventListener('mouseup', ev => this.handleMouseUp(ev));
      this.backdrop.addEventListener('mouseover', ev => this.handleMouseOver(ev));
      this.backdrop.addEventListener('mouseout', ev => this.handleMouseOut(ev));
    }
    //let font = (this.letter == '<' || this.letter == '↵' ? 'helvetiker' : 'doomfont');
    if (true) { //this.letter == '⌫') {
      this.updateText();
      this.text = this.backdrop.createObject('object', {
        id: 'plane',
        pickable: false,
        image_id: 'label',
        scale: V(.15 * 4),
        transparent: true,
        pos: V(0,0,.02),
        depth_test: false,
      });
    } else {
      this.text = this.createObject('text', {
        font: 'doomfont',
        text: this.letter,
        verticalalign: 'middle',
        font_scale: false,
        scale: V(.08),
        col: '#900',
        //col: '#000',
        lighting: false,
      });
    }
  },
  setLetter(letter) {
    this.letter = letter;
    //this.text.text = letter;
    this.updateText();
  },
  updateText() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.loadNewAsset('image', { id: 'label', canvas: this.canvas, transparent: true });
    }
    let canvas = this.canvas,
        ctx = canvas.getContext('2d');
    canvas.width = canvas.height = 48;
    ctx.fillStyle = '#c00';
    ctx.textAlign = 'center';
    if (this.letter == '⌫') ctx.font = 'bold 32px DooM';
    else if (this.letter == '↵') ctx.font = 'bold 48px DooM';
    else ctx.font = '42px DooM';
    ctx.fillText(this.letter, 24, 38);
    this.loadNewAsset('image', { id: 'label', canvas: canvas, transparent: true });
    elation.events.fire({type: 'asset_update', element: canvas});
  },
  setState(state) {
    if (state == 'notfound') {
      this.backdrop.image_id = 'stargr1';
      this.backdrop.col = V(.4);
    } else if (state == 'misplaced') {
//console.log('yuh', state, this);
      //this.backdrop.image_id = 'stargr1';
      //this.backdrop.col = 'blue';
      this.backdrop.image_id = 'startan1';
      this.backdrop.col = 'white';
    } else if (state == 'found') {
      //this.backdrop.image_id = 'stargr1';
      //this.backdrop.col = '#FFAC1C';
      this.backdrop.image_id = 'starg1';
      this.backdrop.col = 'white';
    } else {
      state = 'unknown';
      this.backdrop.image_id = 'stargr1';
      this.backdrop.col = V(1);
    }
    this.state = state;
  },
  handleClick(ev) {
  },
  handleMouseDown(ev) {
    this.backdrop.pos = V(0, 0, -.04);
    //this.text.pos = V(0, 0, -.05);
    navigator.vibrate(20);
    this.dispatchEvent({type: 'keydown', data: this.letter, bubbles: true }); 
setTimeout(() => {
    //this.backdrop.pos = V(0, 0, -.03);
    //this.text.pos = V(0, 0, .01);
}, 60);
  },
  handleMouseUp(ev) {
    this.backdrop.pos = V(0, 0, 0);
  },
  handleMouseOver(ev) {
    if (this.contains(ev.target)) {
      this.backdrop.pos.z = -.02;
    }
  },
  handleMouseOut(ev) {
    this.backdrop.pos.z = 0;
  }
});
room.registerElement('doom-wordle-indicator', {
  num: 0,
  create() {
    this.sprite = this.createObject('doomthing_RedSkullKey', {
      map: { wad: this.getParentByTagName('doom-wordle').iwad },
      pos: V(-.3, .15, 0),
      scale: V(.0125),
      rotation: V(0,0,0),
      skipbillboard: true,
    });
    this.lastframe = performance.now();
  },
  update(dt) {
    this.frametime = performance.now();
    // Animate monsters
    if (this.sprite && this.frametime >= this.lastframe + 333) {
      this.sprite.advanceFrame(this.frametime);
      this.lastframe = this.frametime;
    }
    this.sprite.pos.y = -.11 -  (this.num * .3);
  }
});
room.registerElement('doom-wordle-keyboard', {
  layout: 'qwertyuiop\nasdfghjkl\n↵zxcvbnm⌫',
  create() {
    this.backdrop = this.createObject('object', {
      collision_id: 'plane',
      col: 'pink',
      scale: V(3.5, 1.25, 1),
      pos: V(1.35, -.3, -.2),
    });
    this.letters = {};
    let x = 0, y = 0;
    for (let i = 0; i < this.layout.length; i++) {
      let letter = this.layout[i];
      if (letter == '\n') {
        x = 0;
        y++;
      } else {
        this.letters[letter] = this.createObject('doom-wordle-letter', {
          letter: letter,
          pos: V(x * .3, y * -.3, .02),
          clickable: true,
        });
        x++;
      }
    }
  },
  markFound(letter) {
    this.letters[letter].setState('found');
  },
  markMisplaced(letter) {
    let state = this.letters[letter].state;
    if (state != 'found') {
      this.letters[letter].setState('misplaced');
    }
  },
  markNotFound(letter) {
    let state = this.letters[letter].state;
    if (state != 'found' && state != 'misplaced') {
      this.letters[letter].setState('notfound');
    }
  },
  getStats() {
    let stats = { found: 0, misplaced: 0, notfound: 0, unknown: 0 };
    for (let k in this.letters) {
      if (this.letters[k].state == 'found') stats.found++;
      else if (this.letters[k].state == 'misplaced') stats.misplaced++;
      else if (this.letters[k].state == 'notfound') stats.notfound++;
      else if (this.letters[k].state == 'unknown') stats.unknown++;
    }
    return stats;
  },
  reset() {
    for (let k in this.letters) {
      this.letters[k].setState('unknown');
    }
  },
});
room.registerElement('doom-wordle-face', {
  wad: null,
  invulnerable: false,
  grinning: false,
  pain: false,
  health: 100,
  
  create() {
    this.images = this.wad.getHUDImages();
    this.faces = {};
    this.sprite = this.createObject('object', {
      id: 'plane',
      scale: V(.6, .75, 1),
      col: 'pink',
    });
    this.updateFace();
  },
  setHealth(health) {
    this.health = health;
    this.updateFace();
  },
  updateFace() {
    var lookdir = 1;
    var rand = Math.random();
    if (rand < 0.2) lookdir = 0;
    else if (rand > 0.8) lookdir = 2;

    if (this.invulnerable) {
      this.faceid = 'stfgod0';
    } else if (this.health <= 0) {
      this.faceid = 'stfdead0';
    } else {
      var healthidx = 0;
      if (this.health <= 17) healthidx = 4;
      else if (this.health <= 34) healthidx = 3;
      else if (this.health <= 50) healthidx = 2;
      else if (this.health <= 84) healthidx = 1;

      let facetype = 'st';
      if (this.grinning) {
        facetype = 'evl';
        lookdir = '';
      } else if (this.pain) {
        facetype = 'kill';
        lookdir = '';
      }

      this.faceid = 'stf' + facetype + healthidx + lookdir;
    }

    this.setFace(this.faceid);

    if (this.facetimer) clearTimeout(this.facetimer);
    this.facetimer = setTimeout(() => this.updateFace(), 800 * Math.random() + 1000);
  },
  setFace(faceid) {
    if (!this.faces[faceid]) {
      this.loadNewAsset('image', { id: faceid, canvas: this.images[faceid].canvas, tex_linear: false, hasalpha: true,});
      this.faces[faceid] = true;
    }
    this.sprite.image_id = faceid;
  },
  hurt() {
    this.pain = true;
    setTimeout(() => this.pain = false, 1000);
  },
  reset() {
    this.invulnerable = false;
    this.grinning = false;
    this.pain = false;
    this.setHealth(100);
  },
});
});
