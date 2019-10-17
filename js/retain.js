
//线段起止点处插值
Vec2 line = p1 - p2;//线段P0P1的方向向量
Vec2 normal = Vec2(-line.y, line.x).normalize();//法向量
Vec2 a = P0 + linewidth * normal;//计算插值点的坐标
Vec2 a1 = P0 - linewidth * normal;

//线段中间点处插值
Vec2 t = (P2 - P0).normalize();
Vec2 m = (-t.y, t.x);//中间点方向向量
float length = linewidth / m.dot(normal);//计算中间点处方向向量的长度
Vec2 b = P1 + length * m;//计算中间点的插值点坐标
Vec2 b1 = P1 + length * m;


    <!-- <script src="./js/drawClrLine.js"></script> -->

    <!-- <script id="vertexShader" type="x-shader/x-vertex">
        precision highp float;

        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;

        attribute vec3 position;
        attribute vec4 color;

        varying vec3 vPosition;
        varying vec4 vColor;

        void main (){
            vColor = color ;
            gl_Position = projectionMatrix *  modelViewMatrix * vec4(vPosition, 1.0);
        }
    </script> -->

    <!-- <script id="fragmentShader" type="x-Shader/x-fragment">
        precision highp float;
        
        varying vec3 vPosition;
        varying vec4 vColor;

        void main (){
            vec4 color = vec4(vColor);
            gl_FragColor = color;
        }
    </script> -->

    
        
    <!-- <script>
        var scene = new THREE.Scene();

        var camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
        camera.position.z = 100;
        scene.add( camera );

        var renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild( renderer.domElement );

        var geom = new THREE.Geometry();
        var v1 = new THREE.Vector3(0,0,0);
        var v2 = new THREE.Vector3(30,0,0);
        var v3 = new THREE.Vector3(30,30,0);

        console.log(geom.vertices)
        geom.vertices.push( v1 );
        geom.vertices.push( v2 );
        geom.vertices.push( v3 );

        geom.faces.push( new THREE.Face3( 0, 1, 2 ) );
        geom.computeFaceNormals();

        var mesh= new THREE.Mesh( geom, new THREE.MeshNormalMaterial() );
        scene.add(mesh);

        renderer.render( scene, camera );
    </script> -->

    <!-- <script>
        var container,stats;
        var camera, scene, renderer;
        
        //init();
        //animate();
         function init(){

            container = document.getElementById("container");
            camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10);
            camera.position.z=2;
            camera.lookAt(new THREE.Vextor3(0,0,0));
            
            //
            scene =new THREE.Scene();

            //geometry
            var vector = new THREE.Vector4();
            var positions = [];
            var color = [(1.0,0.0,0.0,1.0)] 
            positions.push(0.5,0.5,0.0);
            positions.push(0.0,1.0,0.0);
            positions.push(0.0,0.0,0.0);

            var geometry = new THREE.InstancedBufferGeometry();
            //geometry.maxInstancedCount = instances;

            geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions,3));
            geometry.addAttribute('color',new THREE.InstancedBufferAttribute(new Float32Array(color),4));

            //material
            var material = new THREE.RawShaderMaterial({
                vertexShader:document.getElementById('vertexShader').textContent,
                fragmentShader:document.getElementById('fragmentShader').textContent,
                side:THREE.DoubleSide,
                transparent:true
            });

            //mesh
            var mesh = new THREE.Mesh(geometry,material);
            scene.add(mesh);

            //renderer
            renderer = new THREE.WebGLRenderer();
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innnerWidth,window.innerHeight);
            container.appendChild(renderer.domElement);

            //
            window.addEventListener('resize', onWindowResize,false);
            
         }

         function onWindowResize(){
             camera.aspect = window.innnerWidth/window.innerHeight;
             camera.updateProjectionMatrix();

             renderer.setSize(window.innerWidth,window.innerHeight);
         }

         function render(){
             //var object = performence.now();
             var object = scene.children[0];
             renderer.render(scene, camera);
         }
         render();
    </script> -->

    <!-- <script>
    //onload="getCoor(data)"
    //获取线段的坐标
    function getCoor(json){
        res = json.features[0].geometry.coordinates;
        //console.log(res);
        var boundary = [];
        //boundary = getBoundary(res);
        var coordinates = convertToWebGLReference(res);
        //console.log(res);
        return res;
    }

    //compute the minimum boundary
    function getBoundary(Array){
        var x=[],y=[];  
        var boundary = [];
        var m,n;
        var count1 = Array.length;

        //console.log();
        for(var i=0;i<count1;i++){
                m = Array[i][0];
                n = Array[i][1];
                x.push(m);
                y.push(n);
        }
        console.log(x);
        console.log(y);
        var max_x=Max(x);
        var min_x=Min(x);
        var max_y=Max(y);
        var min_y=Min(y);
        boundary.push(max_x);
        boundary.push(min_x);
        boundary.push(max_y);
        boundary.push(min_y);
        return boundary;
    }

    function Max(Array){
        var max=-1e300;
        for (var i=0;i<Array.length;i++){
            if(Array[i]>max)
            max=Array[i];
        }
        return max;
    }

    function Min(Array){
    var min=1e300;
        for (var i=0;i<Array.length;i++){
            if(Array[i]<min)
            min=Array[i];
        }
        return min;
    }

    //将坐标转换成webgl的坐标系
    function convert(max,min,x){
        x = 2*(x-min)/(max-min)-1;
        return x;
    }

     //将坐标转换成webgl坐标系
     function convertToWebGLReference(array){
         var boundary = getBoundary(array);
         for(var i=0;i<array.length;i++){
             array[i][0] = convert(boundary[0],boundary[1], array[i][0]);
             array[i][1] = convert(boundary[2],boundary[3], array[i][1]);
         }
         console.log(array);
         return array;
     }

     //计算拓宽线段的插值点
     function trianglePoints(array_line,linewidth){

        //计算起始结点和终节点的插值点
        var len = array_line.length;
        var coors = [];//存储所有的插值点
        var normalVector = [];
        var coor = [];//插值点坐标
        var lastp = [];//存储刚刚得到的插值点
        var delta_x = array_line[1][0]-array_line[0][0];
        var delta_y = array_line[1][1]-array_line[0][1];
        l = sqrt(delta_x,-delta_y);
        normalVector.push(-delta_y/l);
        normalVector.push(delta_x/l);
        x = array_line[0][0]+normalVector[0]*linewidth/2;
        y = array_line[0][1]+normalVector[1]*linewidth/2;
        coor.push(x);
        coor.push(y);
        lastp.push(x);
        lastp.push(y);
        coors.push(coor);

        //计算中间节点插值点
     }

     var vector = new THREE.Vector2();
    //计算中间节点插值点
    function centralPoint( front,current, next,linewidth){
       
        m = current[0]-front[0];
        n = current[1]-front[1];
        o = current[0]-next[0];
        p = current[1]-next[1];
        x = m+n;
        y = o+p;
        len = sqrt(x,y);
        vecotr.x = 
    }



    </script> -->


    function BevelledAntialiased(originData, guiObj){
        var dataVectors = pointToVec(originData);
        var insertCoor = {};//存放四条线的坐标，一共三条三角形坐标条带
    
        var linewidth = guiObj.width*transform();
        var featherWidth = linewidth;
        var twoLineCoor = getTwoWholeLine(dataVectors, linewidth);
        insertCoor.left = twoLineCoor.left;
        insertCoor.right = twoLineCoor.right;
    
        twoLineCoor = getTwoWholeLine(dataVectors, linewidth +  featherWidth);
        insertCoor.leftFeather = twoLineCoor.left;
        insertCoor.rightFeather = twoLineCoor.right;
    
        var leftStrip = addColortoFeatherVertex(insertCoor.leftFeather, insertCoor.left);
        var rightStrip = addColortoFeatherVertex(insertCoor.rightFeather,insertCoor.right);
        var centralStrip = connectBeJoin(dataVectors,linewidth,false);
    
        draw_Bevelled_Feather(centralStrip, leftStrip, rightStrip);
    
    
        function getThreeVertexOfBothSide (p1, p2, p3, lineWidth){
            let vec1 = new THREE.Vector2();
            let vec2 = new THREE.Vector2();
            let vec3 = new THREE.Vector2();
        
            //
            vec1.subVectors(p2,p1);//last to current 方向向量
            vec1.normalize();
            vec2.subVectors(p3,p2);
            vec2.normalize();
            vec3.addVectors(vec1, vec2);
            vec3.normalize();
        
            let points = {};
            //判断折线的折叠方向
            //顺时针
            var sign = cro(vec1, vec2);
            if (sign < 0){
                let normal1 = getNormal(vec1);
                let normal2 = getNormal(vec2);
                let miter = getNormal(vec3);
            
                let point1 = getXY(normal1, p2, lineWidth);
                let point2 = getXY(normal2, p2, lineWidth);
            
                let len = lineWidth/(normal1.dot(miter));
            
                let point3 = getXY(miter.negate(), p2, len);
                // var points = [point1, point3, point2];
                points.left = [point1, point2];
                points.right = point3;
            }
            //逆时针
            else{
                let normal1 = getNormal(vec1);
                let normal2 = getNormal(vec2);
                let miter = getNormal(vec3);
            
                let point1 = getXY(normal1.negate(), p2, lineWidth);
                let point2 = getXY(normal2.negate(), p2, lineWidth);
            
                let len = lineWidth/(normal1.dot(miter));
            
                let point3 = getXY(miter.negate(), p2, len);
                // var points = [point1, point3, point2];
                points.right = [point1, point2];
                points.left = point3;
    
            }
            return points;    
        }
    
        function getTwoWholeLine(originData, lineWidth){
            var points = {};//存储线段的左右两边的插值点
            var pt_lft = [];
            var pt_rht = [];
    
            //起始节点处的处理
            let vec1 = new THREE.Vector2();
            let vec2 = new THREE.Vector2();
        
            vec1.subVectors(originData[1],originData[0]);//last to current 方向向量
            vec1.normalize();
            let normal1 = getNormal(vec1);
        
            let t1 = getXY(normal1, originData[0], lineWidth);
            let t2 = getXY(normal1.negate(), originData[0], lineWidth);
            pt_lft.push(t1);
            pt_rht.push(t2);
        
            //中间节点处的斜接角
            let len = originData.length;
            for(var i = 1; i< len -1; i++){
                var arr = getThreeVertexOfBothSide(originData[i-1], originData[i], originData[i+1], lineWidth);
                var bool_lft =arr.left instanceof Array;
                var bool_rht =arr.right instanceof Array;
                //console.log(bool);
                if(bool_lft){
                    pt_lft = pt_lft.concat(arr.left);
                }
                else{
                    pt_lft.push(arr.left);
                }
                if(bool_rht){
                    pt_rht = pt_rht.concat(arr.right);
                }
                else{
                    pt_rht.push(arr.right);
                }
            }   
        
            //终止节点处的斜接角
            vec2.subVectors(originData[len - 1],originData[len - 2]);
            vec2.normalize();
            let normal2 = getNormal(vec2);
            let t3 = getXY(normal2, originData[len - 1],lineWidth);
            let t4 = getXY(normal2.negate(), originData[len -1],lineWidth);
            pt_lft.push(t3);
            pt_rht.push(t4);
    
            points.left = pt_lft;
            points.right = pt_rht;
        
            return points;
        }
            
    
        function draw_Bevelled_Feather(centralStrip,leftStrip,rightStrip){
            var gl = getContextgl();
            gl.clearColor(0.8, 0.8, 0.8, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            var program = createProgram(gl, v_feather, f_feather);
            gl.useProgram(program.program);
    
            var centralBuffer = createBuffer(gl,new Float32Array(centralStrip));
            // gl.uniform1i(program.u_type,1);
            var colorArray = [];
            for(var i =0; i<centralStrip.length/2; i++){
                colorArray = colorArray.concat([0,0,0,0.8]);
            }
            bindAttribute(gl,centralBuffer,program.a_triPos,2);  
            var colorBuffer = createBuffer(gl,new Float32Array(colorArray));
    
            bindAttribute(gl, colorBuffer,program.a_color,4);
            var n = centralStrip.length/2;
            gl.drawArrays(gl.TRIANGLES,0,n);
    
    
            //羽化
            if(guiObj.feather){
                var triangleBuffer = createBuffer(gl,new Float32Array(leftStrip.triangleStirp));
                var colorBuffer1 = createBuffer(gl,new Float32Array(leftStrip.colorArr));
                bindAttribute(gl,triangleBuffer,program.a_triPos,2);
                bindAttribute(gl, colorBuffer1,program.a_color,4);
                var num = leftStrip.triangleStirp.length/2;
                console.log(num);
                gl.drawArrays(gl.TRIANGLES,0,num);
    
                triangleBuffer = createBuffer(gl,new Float32Array(rightStrip.triangleStirp));
                colorBuffer1 = createBuffer(gl,new Float32Array(rightStrip.colorArr));
                bindAttribute(gl,triangleBuffer,program.a_triPos,2);
                bindAttribute(gl, colorBuffer1,program.a_color,4);
                num = rightStrip.triangleStirp.length/2;
                gl.drawArrays(gl.TRIANGLES,0,num);        }
        }
    }