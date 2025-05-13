

import * as THREE from '../Libraries/threeJs/three.module.js';
import { GLTFLoader } from '../Libraries/threeJs/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from '../Libraries/threeJs/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from '../Libraries/threeJs/examples/jsm/controls/OrbitControls.js';

let currentTransition = null;

export async function initThreeJS(canvas, width, height, dotNetHelper) {

    const scene = new THREE.Scene();
   
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });


    const loadingManager = new THREE.LoadingManager();
    loadingManager.onLoad = function () {
        console.log('---------------------> loaded');
        dotNetHelper.invokeMethodAsync('HandleProgress', false);
    }

    let currentModel = null;
    let animationFrameId = null;
  
    let isTransitioning = false;

    const TARGET_FIT_RADIUS = 3; 
    const MIN_CAMERA_DISTANCE = TARGET_FIT_RADIUS * 1.1; 
    const MAX_CAMERA_DISTANCE = TARGET_FIT_RADIUS * 5; 
    const INITIAL_CAMERA_DISTANCE = TARGET_FIT_RADIUS * 2.5; 

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5); 
    scene.add(directionalLight);
    new RGBELoader(loadingManager).load("../models/newhdr.hdr", function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture; 
    }, undefined, (error) => {
        console.error("Failed to load HDR:", error);
        
        scene.background = new THREE.Color(0x808080);
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;      
    controls.dampingFactor = 0.05;    
    controls.screenSpacePanning = false; 
    controls.enablePan = false;          

 
    controls.minDistance = MIN_CAMERA_DISTANCE;
    controls.maxDistance = MAX_CAMERA_DISTANCE;

    controls.target.set(0, 0, 0);
   
    camera.position.set(0, 0, INITIAL_CAMERA_DISTANCE); 
    controls.update(); 

    

    async function loadModel(modelUrl) {
      

        const loader = new GLTFLoader(loadingManager);
        const gltf = await loader.loadAsync(modelUrl);
        const model = gltf.scene;

     
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

     
        model.position.sub(center);

     
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) { 
            const scale = (TARGET_FIT_RADIUS * 2) / maxDim; 
            model.scale.set(scale, scale, scale);
        }
       

        return model;
    }

    async function transitionModels(newModelUrl) {
      
        const fullModelUrl = '../models/' + newModelUrl;

        if (currentTransition) {
            console.log("Cancelling previous transition");
            currentTransition.cancel();
           
        }

        const controller = new AbortController();
        currentTransition = {
            controller: controller,
            cancel: () => {
                console.log("Abort requested for:", fullModelUrl);
                controller.abort();
               
                isTransitioning = false;
               
            }
        };

        if (isTransitioning) {
            console.log("Transition already in progress, new request ignored for:", fullModelUrl);
           
            return;
        }

        console.log("Starting transition to:", fullModelUrl);
        isTransitioning = true;

        try {
           
            if (currentModel) {
                const oldModel = currentModel; 
                currentModel = null;         
                console.log("Animating out old model");
                const startX = oldModel.position.x; 
                await animatePosition(oldModel, startX, startX - (MAX_CAMERA_DISTANCE * 2), 500, controller.signal); 
                if (!controller.signal.aborted) {
                    scene.remove(oldModel);
                    console.log("Old model removed");
                   
                } else {
                    console.log("Transition aborted during fade out");
                    scene.remove(oldModel); 
                    throw new DOMException('Aborted during fade out', 'AbortError');
                }
            }

            if (controller.signal.aborted) throw new DOMException('Aborted before loading new model', 'AbortError');

          
            console.log("Loading new model:", fullModelUrl);
            const newModel = await loadModel(fullModelUrl); 
            if (controller.signal.aborted) {
                console.log("Transition aborted after load, before adding to scene");
              
                throw new DOMException('Aborted after loading', 'AbortError');
            }

            newModel.position.x = MAX_CAMERA_DISTANCE * 2; 
            scene.add(newModel);
            console.log("New model added to scene, starting animation in");

        
            await animatePosition(newModel, newModel.position.x, 0, 500, controller.signal); 

            if (controller.signal.aborted) {
                console.log("Transition aborted during fade in");
                scene.remove(newModel);
              
                throw new DOMException('Aborted during fade in', 'AbortError');
            }

            console.log("New model animation complete");
            currentModel = newModel;

          
            camera.position.set(0, 0, INITIAL_CAMERA_DISTANCE); 
            controls.target.set(0, 0, 0);                     
            controls.update();                                

            console.log("Transition complete for:", fullModelUrl);

        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('Transition aborted:', error.message);
            } else {
                console.error("Error during transition:", error);
               
                if (scene.children.includes(currentModel)) { 
                    scene.remove(currentModel);
                    currentModel = null;
                }
            }
        } finally {
            console.log("Transition finally block executing");
            isTransitioning = false;
          
            if (currentTransition && currentTransition.controller === controller) {
                currentTransition = null;
            }
        }
    }

   
    function animatePosition(object, start, end, duration, signal) {
        return new Promise((resolve, reject) => {
            if (signal && signal.aborted) {
                return reject(new DOMException('Aborted before animation started', 'AbortError'));
            }
            const startTime = Date.now();
            let frameId;

            function update() {
                if (signal && signal.aborted) {
                    cancelAnimationFrame(frameId);
                    return reject(new DOMException('Aborted during animation update', 'AbortError'));
                }

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1); 

                object.position.x = start + (end - start) * progress;

                if (progress < 1) {
                    frameId = requestAnimationFrame(update);
                } else {
                    object.position.x = end; 
                    resolve();
                }
            }

           
            const abortHandler = () => {
                cancelAnimationFrame(frameId);
                reject(new DOMException('Aborted via signal listener', 'AbortError'));
            };
            signal?.addEventListener('abort', abortHandler);

           
            update();
        });
    }


    function animate() {
        animationFrameId = requestAnimationFrame(animate); 

        controls.update(); 

        renderer.render(scene, camera);
    }

    renderer.setSize(width, height);
    animate();

    return {
        transitionModels: (modelUrl) => transitionModels(modelUrl),
        resize: (newWidth, newHeight) => {
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        },
        dispose: () => {
            console.log("Disposing Three.js instance");
            cancelAnimationFrame(animationFrameId);
            if (currentTransition) {
                currentTransition.cancel(); 
            }
            
            scene.traverse(object => {
                if (object.isMesh) {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(mat => {
                                if (mat.map) mat.map.dispose();
                          
                                mat.dispose();
                            });
                        } else {
                            if (object.material.map) object.material.map.dispose();
                          
                            object.material.dispose();
                        }
                    }
                }
            });
         
            if (scene.background && scene.background.dispose) scene.background.dispose();
            if (scene.environment && scene.environment.dispose) scene.environment.dispose();

            controls.dispose();
            renderer.dispose();
           
        }
    };
}


