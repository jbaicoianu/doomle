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
    this.backdrop = this.createObject('object', { id: 'plane', image_id: 'skintek1', pos: V(0, -(scale * (repeaty - 3)) / 2, -4.5), scale: V(scale * 3, scale * repeaty), texture_repeat: V(3, repeaty * aspect), pickable: false, collidable: false, });

    this.layout = this.createObject('layout-template', { transitioneasing: 'ease-out-elastic', transitiontime: 750 });
    let masterlayout = this.layout.createObject('layout-master');
    let gameslot = masterlayout.createObject('layout-slot', { slotname: 'gameslot', pos: V(-.6, 2.5, 0) });
    let keyboardslot = masterlayout.createObject('layout-slot', { slotname: 'keyboardslot', pos: V(-.65, .8, 0) });

    this.logo = this.createObject('object', {
      id: 'plane',
      image_id: 'doomle',
      scale: V(4, 1, 1),
      pos: V(0, 4.6, -3.15)
    })
    this.face = this.createObject('doom-wordle-face', {
      pos: V(-.21, 4.6, -3.1),
      wad: this.iwad,
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

  },
  loadTexture(name) {
    let tex = this.iwad.getTexture(name);
    this.loadNewAsset('image', { id: name, canvas: tex.canvas, tex_linear: false,});
//console.log('did tex', name, tex);

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
    });
    if (this.clickable) {
      this.backdrop.addEventListener('click', ev => this.handleClick(ev));
      this.backdrop.addEventListener('mousedown', ev => this.handleMouseDown(ev));
      this.backdrop.addEventListener('mouseup', ev => this.handleMouseUp(ev));
    }
    //let font = (this.letter == '<' || this.letter == '↵' ? 'helvetiker' : 'doomfont');
    if (true) { //this.letter == '⌫') {
      this.updateText();
      this.text = this.backdrop.createObject('object', {
        id: 'plane',
        image_id: 'label',
        scale: V(.15 * 4),
        transparent: true,
        pos: V(0,0,.01),
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
    this.backdrop.pos = V(0, 0, -.05);
    //this.text.pos = V(0, 0, -.05);
    navigator.vibrate(20);
    this.dispatchEvent({type: 'keydown', data: this.letter, bubbles: true }); 
setTimeout(() => {
    this.backdrop.pos = V(0, 0, 0);
    //this.text.pos = V(0, 0, .01);
}, 60);
  },
  handleMouseUp(ev) {
  },
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
