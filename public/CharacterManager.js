import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class CharacterManager {

    constructor( scene, camera ) {
        this.scene = scene;
        this.camera = camera;
        this.gltfLoader = new GLTFLoader();
    }

    /* Public 公開方法 */
    async loadCharacter() {

        const meshContainer = new THREE.Group();
        const gltf = await this.__loadGTLFAsync( './Character.glb' );
        const mesh = gltf.scene;
        meshContainer.add( mesh );
        mesh.rotation.y = THREE.MathUtils.degToRad( 180 );
        meshContainer.getMesh = function() { return this.children[0] }

        await this.__loadAnimations( gltf );
        return meshContainer;

    }

    /* Public 公開方法 */
    hiddenMesh( mesh ) {
        mesh.traverse( 
            object => { 
                if( object.isMesh ) { object.visible = false; }
            }
        );
    }

    /* Public 公開方法 */
    bindAction( controller, mesh ) {
        const actions = ['walk_forward', 'walk_left', 'walk_backward', 'walk_right', 'run', 'idle', 'walk'];
        actions.forEach(action => {
            controller[action] = () => { 
                this.__setCurrentAction(mesh, action); 
            };
        });
    }

    /* Public 公開方法 */
    updateCharactersAnimation( delta, playerList ){
        
        for( const meshContainer of playerList ) {

            const characterData = meshContainer.children[0].userData;
    
            const { animations, currentActionName, previousActionName, mixer } = characterData;
            if( currentActionName !== previousActionName ) {
                console.log(currentActionName)
                const startAction = animations[previousActionName].action;
                const endAction = animations[currentActionName].action;
                this.__executeCrossFade(startAction, endAction, 0.2);
                characterData.previousActionName = currentActionName;
            }
    
            mixer.update( delta );
    
        }

    }

    /* Private 私有方法 */
    __setCurrentAction ( mesh, actionName ) {
        switch( actionName ) {
            case 'run': {
                switch( mesh.userData.currentActionName ) {
                    case 'walk_forward': mesh.userData.currentActionName = 'run_forward'; break;
                    case 'walk_left': mesh.userData.currentActionName = 'run_left'; break;
                    case 'walk_right': mesh.userData.currentActionName = 'run_right'; break;
                }
                break;
            }
            case 'walk': {
                switch( mesh.userData.currentActionName ) {
                    case 'run_forward': mesh.userData.currentActionName = 'walk_forward'; break;
                    case 'run_left': mesh.userData.currentActionName = 'walk_left'; break;
                    case 'run_right': mesh.userData.currentActionName = 'walk_right'; break;
                }
                break;
            }
            default: { mesh.userData.currentActionName = actionName; }
        }
    }

    /* Private 私有方法 */
    __executeCrossFade ( startAction, endAction, duration ) {

        endAction.enabled = true;
        endAction.setEffectiveTimeScale( 1 );
        endAction.setEffectiveWeight( 1 );
        endAction.time = 0;
        if ( startAction ) { startAction.crossFadeTo( endAction, duration, true ); } 
        else { endAction.fadeIn( duration ); }
        
    }

    /* Private 私有方法 */
    async __loadAnimations( gltf ) {

        const animationGLBFiles = [ './idle.glb', './run_forward.glb', './run_left.glb', './run_right.glb', './walk_forward.glb', './walk_backward.glb','./walk_right.glb', './walk_left.glb', './jump_start.glb', './jump_loop.glb', './jump_end.glb', ];
        const character = gltf.scene;
        const mixer = new THREE.AnimationMixer( character );
        const animations = {};
        character.userData = { mixer, animations, currentActionName: 'idle', previousActionName: 'idle' };
        
        await Promise.all( animationGLBFiles.map( async ( file ) => {
            const gltf = await this.__loadGTLFAsync( file );
            this.scene.add( gltf.scene );
            const clip = gltf.animations[ 0 ];
            const action = mixer.clipAction( clip );
            const name = clip.name.slice( 0, -2 );
            const weight = name === 'idle' ? 1 : 0;
            action.enabled = true;
            action.setEffectiveTimeScale( 1 );
            action.setEffectiveWeight( weight );
            action.play();
            animations[ name ] = { action, name };
        }));

        return;
    }

    /* Private 私有方法 */
    async __loadGTLFAsync( url ) { 

        return new Promise( ( resolve, reject ) => { 
    
            this.gltfLoader.load( url, resolve, undefined, reject ); 
    
        }); 
    
    }

}

export default CharacterManager;