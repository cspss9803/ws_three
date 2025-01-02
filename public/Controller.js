import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

class Controller {

    constructor( scene, camera, canvas ){
        this.camera = camera;
        this.canvas = canvas;
        this.scene = scene;
        this.controls = new PointerLockControls( camera, this.canvas );
        this.__setupMovement();
        this.__setupListeners();
        this.__setupActions();
        
        camera.position.y = this.playerHight;
        this.scene.add( camera );
    }

    /* Private 私有方法 */
    __setupMovement() {
        this.playerHight = 1.66;
        this.moveDistance = 16.0;
        this.moveFriction = 10;
        this.jumpHight = 20.0;
        this.gravity = 8.0;
        this.movingForward = false;
        this.movingBackward = false;
        this.movingLeft = false;
        this.movingRight = false;
        this.canJump = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
    }

    /* Private 私有方法 */
    __setupListeners() {
        document.addEventListener('keydown', this.__handleKeyDown.bind(this));
        document.addEventListener('keyup', this.__handleKeyUp.bind(this));
    }

    /* Private 私有方法 */
    __setupActions() {
        this.walk_forward = () => {};
        this.walk_left = () => {};
        this.walk_backward = () => {};
        this.walk_right = () => {};
        this.run = () => {};
        this.idle = () => {};
        this.walk = () => {};
    }

    /* Private 私有方法 */
    __handleKeyDown( event ) {
        if( !this.canJump ) return;
        if( ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes( event.code ) ) this.moveDistance = 16;
        const actions = {
            'KeyW':  () => { this.movingForward  = true; this.walk_forward();  },
            'KeyA':  () => { this.movingLeft     = true; this.walk_left();     },
            'KeyS':  () => { this.movingBackward = true; this.walk_backward(); },
            'KeyD':  () => { this.movingRight    = true; this.walk_right();    },
            'Space': () => { this.velocity.y += this.jumpHight; this.canJump = false; },
            'ShiftLeft': () => { this.run(); this.moveDistance = 40; },
        }
        if ( actions[ event.code ] ) actions[ event.code ]();
    };

    /* Private 私有方法 */
    __handleKeyUp( event ) { 
        if( !this.canJump ) return;
        const actions = {
            'KeyW': () => { this.movingForward  = false; this.idle(); },
            'KeyA': () => { this.movingLeft     = false; this.idle(); },
            'KeyD': () => { this.movingRight    = false; this.idle(); },
            'KeyS': () => { this.movingBackward = false; this.idle(); },
            'ShiftLeft': () => { this.walk(); },
        };
        if ( actions[ event.code ] ) actions[ event.code ]();
    }

    /* Private 私有方法 */
    __resetState() {
        this.movingForward = false;
        this.movingBackward = false;
        this.movingLeft = false;
        this.movingRight = false;
        this.canJump = false;
        this.idle();
    }

    /* Private 私有方法 */
    __getRotationShaveXZ( object ) {
        const quaternion = object.quaternion.clone();
        const euler = new THREE.Euler().setFromQuaternion( quaternion, 'YXZ' );
        return new THREE.Euler(0, euler.y, 0, 'ZXY');
    }

    /* Public 公開方法 */
    update ( delta ) {

        const player = this.camera;
        const playerPosition = player.position;
    
        this.velocity.x -= this.velocity.x * this.moveFriction * delta;
        this.velocity.z -= this.velocity.z * this.moveFriction * delta;
        this.velocity.y -= 9.8 * this.gravity * delta;

        this.direction.z = Number( this.movingForward ) - Number( this.movingBackward );
        this.direction.x = Number( this.movingRight ) - Number( this.movingLeft );
        this.direction.normalize();

        if ( this.movingForward || this.movingBackward ) this.velocity.z -= this.direction.z * this.moveDistance * delta;
        if ( this.movingLeft || this.movingRight ) this.velocity.x -= this.direction.x * this.moveDistance * delta;

        this.controls.moveRight( - this.velocity.x * delta );
        this.controls.moveForward( - this.velocity.z * delta );
        playerPosition.y += this.velocity.y * delta;

        if ( playerPosition.y < this.playerHight ) { 
            this.velocity.y = 0; 
            playerPosition.y = this.playerHight; 
            this.canJump = true; 
        }

        const characterData = player.children[0].children[0].userData;
        const { currentActionName, previousActionName } = characterData;
        const rotation = this.__getRotationShaveXZ( player );
        const position = new THREE.Vector3(playerPosition.x, playerPosition.y - this.playerHight, playerPosition.z)
        return { context: 'playerMove', position, rotation, currentActionName, previousActionName };

    }

    /* Public 公開方法 */
    setupBlocker( blocker ) {
        blocker.addEventListener( 'click', () => { this.controls.lock(); } );
        this.controls.addEventListener( 'lock', () => {  blocker.style.display = 'none'; });
        this.controls.addEventListener( 'unlock', () => {  blocker.style.display = 'block'; this.__resetState(); });
    }
}

export default Controller;