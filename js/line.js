//vertex shader
var v_Shader=`
attribute vec4 a_Position;
void main(){
gl_Position = a_Position;
}`;

//fragment shader
var f_Shader = `
precision mediump float;
uniform vec4 u_color;
void main(){
    gl_FragColor = u_color;
}`;

function getContextgl(){
    var canvas = document.getElementById("webgl");
    var gl = canvas.getContext('webgl', {antialias: true});
    // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    return gl;
}

//绘制渐变的河网
function drawRiver(){
    var gl = getContextgl();
    gl.clearColor(0.95, 0.95, 0.95, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var program = createProgram(gl, v_Shader, f_Shader);
    gl.useProgram(program.program);

    gl.uniform4fv(program.u_color, [0.0,0.0,1.0,1.0]);

    var array = [];
    array = getTriangleVertex(originData);  

    var riverBuffer = createBuffer(gl, new Float32Array(array));
    bindAttribute(gl, riverBuffer, program.a_Position, 2);
    var n = array.length / 2;
    gl.drawArrays(gl.TRIANGLES,0,n);

}

function drawSlide(){
    var gl = getContextgl();
    var slideProgram = createProgram(gl, v_Shader, f_Shader);
    gl.useProgram(slideProgram.program);

    gl.uniform4fv(slideProgram.u_color, [1.0,1.0,1.0,1.0]);

    var array = [];
    array = splitLine(data2);
    //console.log(array);
    var slideBuffer = createBuffer(gl, new Float32Array(array));
    bindAttribute(gl, slideBuffer, slideProgram.a_Position, 3);
    var n = array.length / 3;
    gl.drawArrays(gl.TRIANGLES,0,n);
}

function draw(){
    addIndex(data2);

    drawRiver();

    //匿名函数
    setInterval(() => {drawRiver();drawSlide()}, 100); 
    // setInterval(drawSlide,100);
}

function drawLine(river){
    
    var gl = getContextgl();
    var program = createProgram(gl, v_Shader, f_Shader);
    gl.useProgram(program.program);


    var array = [];
    var w = river.width;

    if(!river.feather){
        array = initialize(PS,w);
    
        gl.uniform4fv(program.u_color, [0.0,0.0,1.0,1.0]);    
        var riverBuffer = createBuffer(gl, new Float32Array(array[0]));
        bindAttribute(gl, riverBuffer, program.a_Position, 2);
        var n = array[0].length / 2;
        gl.drawArrays(gl.TRIANGLES,0,n);
    }


    else{
        //羽化
        function getFeather(width){
            var delta = width/5;
            console.log(delta);
            //var count = 0;
            for(var i =0; i<5; i++){
                var array = initialize(river.width+delta);
                gl.uniform4fv(program2.u_color, [0.0,0.0,1.0,1-0.08*i]);
                //console.log(program2.u_color);
                var riverBuffer = createBuffer(gl, new Float32Array(array[0]));
                bindAttribute(gl, riverBuffer, program2.a_Position, 2);
                var n = array[0].length / 2;
                gl.drawArrays(gl.TRIANGLES,0,n);
                //count +=1;
            }
            //console.log(count);
            return array;
        }  

        getFeather(20);

        //未羽化的中间线
        array = initialize(river.width);

        gl.uniform4fv(program2.u_color, [0.0,0.0,1.0,1.0]);    
        var riverBuffer = createBuffer(gl, new Float32Array(array[0]));
        bindAttribute(gl, riverBuffer, program2.a_Position, 2);
        var n = array[0].length / 2;
        gl.drawArrays(gl.TRIANGLES,0,n);           
    }

}

function drawGradientPolyline(){
    var gl = getContextgl();
    var program = createProgram(gl, v_Shader, f_Shader);
    gl.useProgram(program.program);

    var array = [];
    var w = 50*transform();

    array = gradientSeg(PS,w,0.3,true);
    gl.uniform4fv(program.u_color, [0.0,0.0,1.0,1.0]);    
    var riverBuffer = createBuffer(gl, new Float32Array(array));
    bindAttribute(gl, riverBuffer, program.a_Position, 2);
    var n = array.length / 2;
    gl.drawArrays(gl.TRIANGLES,0,n);

}
function drawSharpJoint(guiObj){
    var gl = getContextgl();
    var program = createProgram(gl, v_Shader, f_Shader);
    gl.useProgram(program.program);

    var array = [];
    var w = guiObj.width*transform();

    array = sharpJoint(PS,w,guiObj.gradient);
    gl.uniform4fv(program.u_color, [0.0,0.0,1.0,1.0]);    
    var riverBuffer = createBuffer(gl, new Float32Array(array));
    bindAttribute(gl, riverBuffer, program.a_Position, 2);
    var n = array.length / 2;
    gl.drawArrays(gl.TRIANGLES,0,n);

}

function drawBevelledJoint(guiObj){
    var gl = getContextgl();
    var program = createProgram(gl, v_Shader, f_Shader);
    gl.useProgram(program.program);

    var array = [];
    var w = guiObj.width*transform();

    array = bevelledJoint(PS,w,guiObj.gradient);

    if(guiObj.join == 'bevelledJoint'){
        gl.uniform4fv(program.u_color, [0.0,0.0,1.0,1.0]);    
        var riverBuffer = createBuffer(gl, new Float32Array(array[0]));
        bindAttribute(gl, riverBuffer, program.a_Position, 2);
        var n = array[0].length / 2;
        gl.drawArrays(gl.TRIANGLES,0,n);    
    }

    else if(guiObj.join == 'ArcJoint'){
        gl.uniform4fv(program.u_color, [0.0,0.0,1.0,1.0]);    
        var riverBuffer = createBuffer(gl, new Float32Array(array[0]));
        bindAttribute(gl, riverBuffer, program.a_Position, 2);
        var n = array[0].length / 2;
        gl.drawArrays(gl.TRIANGLES,0,n);
        
        gl.uniform4fv(program.u_color, [0.0,0.0,1.0,1.0]);    
        for(var i = 0; i<array[1].length; i++){
            let ArcBuffer = createBuffer(gl, new Float32Array(array[1][i]));
            bindAttribute(gl, ArcBuffer, program.a_Position, 2);
            var n = array[1][i].length / 2;
            gl.drawArrays(gl.TRIANGLE_FAN,0,n);    
        }    
    }
    //绘制圆角
}


//用面表现线，不考虑渐变
function loadFile(){
    //var lines = getlines(data2);
    var pointsXY = [];
    getMapSize(getlines(data2));
    getRatio();
    var varible = 6;
    var classes = classifyData(data2);
    
    var lines = [];
    for (var m = 0; m<classes.length; m++){
        var varible = varible - 0.5*m;
        var linewidth = varible * ratio.r;
        for(var n = 0; n<classes[m].length; n++){
            var c1 = classes[m];
            var line = c1[n].geometry.coordinates;
            lines.push(line);
        }
        // console.log(lines);
        
        var len = lines.length;
        for (var i = 0; i<len; i++){
            var line = lines[i];
            var res = getCoorVector2(line);
            res = insertPoints(res, linewidth);
            res = convertCor(res); 
            //console.log(res); 
            for (var j = 0; j<res.length; j++){
                pointsXY.push(res[j]);
            }
        }
    }
    return pointsXY;
}

//获得绘制河流的所有三角形顶点
function getTriangleVertex(originRiverData){
    var lines = allLines(originRiverData);
    var points = changeWidth(lines.lines,originRiverData);
    return points;
}

var step = 5;
var strip = 30;

//用id分别标识每一个线段
var lines_id = [];
function addIndex(originRiverData){
    lines_id = allLines(originRiverData);
    lines_id = getPoints(lines_id);
    function add(item){
        item.id = 0;
    }
    lines_id.forEach(add);
}

//根据时间来计算需要画出来的线段部分
function splitLine(oringinRiverData){
    var boundary = getMapSize(getlines(oringinRiverData));
    var ratio = getRatio(boundary);
    var positions = [];
    var lineWidth = ratio * 2;
    for (var i = 0; i<lines_id.length; i++){
        var res = splitALine(lines_id[i]);
        if (lines_id[i].id < lines_id[i].length){
            lines_id[i].id += step;
        }
        else
            lines_id[i].id = 0;

        for(var j =0;j<res.length; j++){
            var arr = insertPoints(res[j], lineWidth);
            arr = ptsToTriangles(arr[0],arr[1]);
            arr = convertCor(arr,boundary);
            for (var k = 0; k<arr.length; k += 2){
                positions.push(arr[k]);
                positions.push(arr[k+1]);
                positions.push(1);
            }
        }
    }
    return positions;
}

//根据绘制的时间切分没一条河流
function splitALine(line){ 
    var min = line.id;
    var max = min + strip;
    var len = line.length;
    var seg = [];
    if(len <= strip){
        seg.push(line);
        return seg;
    }
    if (max <= len ){
        let l = line.slice(min, max);
        seg.push(l);
    }
    else if(min >= len){
        let l = line.slice(0,strip);
        seg.push(l);
    }
    else {
        var last = line.slice(min, len);
        if(last.length>2)
            seg.push(last);
        var next = line.slice(0, max % len);
        if(next.length>2){
            seg.push(next);    
        }
    }
    return seg;
}

function changeWidth(allLines,originRiverData){
    var pointsXY = [];
    var initWidth = 8;
    for(var i = 0;i<allLines.length; i++){
        for (var j = 0; j<allLines[i].length; j++){
            wholeLine = allLines[i][j];
            wholeLine = gradientLine(wholeLine, initWidth,originRiverData);
            for (var k = 0; k<wholeLine.length;k++){
                pointsXY.push(wholeLine[k]);
            }
        }
        initWidth -= 0.5;
    }
    return pointsXY;
}

//获取所有首尾相接的六个等级的河流
function allLines(originRiver){
    //将所有线段分等级进行存储，共分为六个等级
    var classes = classifyData(originRiver);
    var allLines = [];
    let lineWithLevel = {};
    let level = [];
    // for(var i = 0; i<classes.length; i++){
    for(var i = 0; i<classes.length; i++){
        var sameRankLines = [];

        //找到河流源头点的的索引
        var sourceIndex = findHead(classes[i]);
        // console.log(sourceIndex);
        for(var j =0; j<sourceIndex.length; j++){
            var rank = classes[i].slice(0);
            // console.log(rank);
            var wholeLine = [];
            wholeLine = getConnectLine(rank, sourceIndex[j]);
            sameRankLines.push(wholeLine);
        }
        allLines.push(sameRankLines);
        level.push(i+1);
    }

    lineWithLevel.lines = allLines;
    lineWithLevel.level = level;

    return lineWithLevel;
}

//获得一条完整河流的所有点的坐标
function getPoints(array){
    var lineWithLevel = {};
    var lines = [];
    var level = [];
    var allLines = array.lines;
    for (var i = 0; i<allLines.length; i++){
        let level_temp  = array.level[i];
        // console.log(level_temp);
        for (var j = 0; j<allLines[i].length; j++){
            let coords = [];
            for (var m = 0; m<allLines[i][j].length; m++){
                for (var n = 1; n<allLines[i][j][m].length; n++){
                    coords.push(allLines[i][j][m][n]);
                }
            }
            lines.push(coords);
            level.push(level_temp);
        }
    }

    lineWithLevel.coors = lines;
    lineWithLevel.level = level;

    console.log(lineWithLevel);
    // return lines;
    return lineWithLevel;
}

//同等级渐变
function gradientLine(line,initWidth,originRiverData){
    var boundary = getMapSize(getlines(originRiverData));
    var ratio = getRatio(boundary);

    var pointsXY = [];
    var len = line.length;
    var delta = 6/len; 
    for(var i = 0; i<len; i++){
        var lineWidth = (initWidth + delta * i) * ratio;

        console.log(line[i]);
        // let addPt_result = splitePolyline(line[i],0.01) ;

        var res = insertPoints(line[i], lineWidth,false);
        var position = [];
        position = ptsToTriangles(res[0],res[1]);

        res = convertCor(position,boundary,originRiverData);
        for (var j = 0; j<res.length; j++){
            pointsXY.push(res[j]);
        }    
    }
    return pointsXY;
}

//获取河网中每一条线段
function getlines(network){
    var mutiple_lines = [];
    var mutiple_line = [];
    mutiple_line = network.features;
    for (var i=0;i<mutiple_line.length;i++){
        let coordinates = [];
        coordinates = mutiple_line[i].geometry.coordinates;
        mutiple_lines.push(coordinates);
    } 
    return mutiple_lines;
}

//convert every line's coordiante to webgl conference from the oringinal array
function convertCor(array,boundary){
    var polylines=[];
    var len = array.length;

    for(var i=0; i<len ; i++){
        var m = array[i].x;
        var n = array[i].y;
        m = convertToWebGLReference( boundary.maxX, boundary.minX, m);
        n = convertToWebGLReference( boundary.maxY, boundary.minY, n);       
        polylines.push(m/1.2);
        polylines.push(n/2);
    }
    return polylines;
}

function convertCor_To_gl(array,boundary){
    var polylines=[];
    var len = array.length;

    for(var i=0; i<len ; i++){
        var m = array[i].x;
        var n = array[i].y;
        m = convertToWebGLReference( boundary.maxX, boundary.minX, m);
        n = convertToWebGLReference( boundary.maxY, boundary.minY, n);       
        let coor = new THREE.Vector2(m,n);
        polylines.push(coor);
    }
    return polylines;

}


function getRatio(boundary){
    var canvas = document.getElementById("webgl");
    var clientboundary = canvas.getBoundingClientRect();
    var height = clientboundary.height;
    var width = clientboundary.width;
    var w = (boundary.maxX- boundary.minX)/width;
    var h = (boundary.maxY- boundary.minY)/height;
    let ratio;
    if(w > h)
        ratio= h;
    else
        ratio= w;
    return ratio;
}

//输入参数为线段数组
function getMapSize(lines){
    var boundary = {
        maxX : -1e3,
        minX : 1e3,
        maxY : -1e3,
        minY : 1e3
    }

    var len1 = lines.length;
    var x = [];
    var y = [];
    for (var i = 0; i<len1; i++){
        var len2 = lines[i].length;
        for(var j = 0; j<len2; j++){
            x.push(lines[i][j][0]);
            y.push(lines[i][j][1]);
        }
    }
    boundary.maxX = Max(x);
    boundary.minX = Min(x);
    boundary.maxY = Max(y);
    boundary.minY = Min(y);
    return boundary;
}

//获取线段的坐标
function getCoorVector2(json){

    var vectors = [];
    for(var i=0;i<json.length;i++){
        var x = json[i][0];
        var y = json[i][1];
        //getMapBoundary(x,y);

        var v = new THREE.Vector2(x,y);
        vectors.push(v);
    }
    return vectors;
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

function convertToWebGLReference(max,min,x){
    x = 2*(x-min)/(max-min)-1;
    // x = x/2;
    return x;
}

//锐角相接
//计算插值点并按照顺序存储
//第三个参数表示是否渐变
function insertPoints(vectors ,width, isGradient){
    if(vectors.length < 2 && vectors.length != 0){
        vectors = [];
        return vectors;
    }

    var Points1 = [];    //分别存储线段两侧的点
    var Points2 = [];
    var len = vectors.length;
    let x = vectors[1].x - vectors[0].x;
    let y = vectors[1].y - vectors[0].y;

    let v1 = new THREE.Vector2(-y, x);
    let v2 = new THREE.Vector2();
    let v3 = new THREE.Vector2();


    v1.normalize();
    v3.copy(v1);//保留方向向量
    
    x = v1.x*width/2 + vectors[0].x;
    y = v1.y*width/2 + vectors[0].y;
    v1.setX(x);
    v1.setY(y);
    Points1.push(v1);

    x = vectors[0].x - v3.x*width/2;
    y = vectors[0].y - v3.y*width/2;
    v2.setX(x);
    v2.setY(y);
    Points2.push(v2);
    
    for (let i= 1;i<len-1;i++){
        if(isGradient){
            var linewidth = width + width * i / len;
        }
        else linewidth = width;
        
        let vec1 = new THREE.Vector2();
        let vec2 = new THREE.Vector2();

        //
        vec1.subVectors(vectors[i],vectors[i-1]);//last to current 方向向量
        vec1.normalize();
        vec2.subVectors(vectors[i+1],vectors[i]);
        vec2.normalize();
        let vec3 = new THREE.Vector2();
        vec3.addVectors(vec1, vec2);
        vec3.normalize();

        let normal = new THREE.Vector2(-vec1.y,vec1.x);
        let miter = new THREE.Vector2(-vec3.y,vec3.x);

        let angle_len = linewidth/2/(normal.dot(miter));
    
        let m = miter.x*angle_len;
        let n = miter.y*angle_len;
        x = m + vectors[i].x;
        y = n + vectors[i].y;
        let point1 = new THREE.Vector2(x,y);

        x = vectors[i].x - m;
        y = vectors[i].y - n;
        let point2 = new THREE.Vector2(x,y);

        Points1.push(point1);
        Points2.push(point2);
        
    }

    //计算终止结点处的插值点
    x = vectors[len-1].x - vectors[len-2].x;
    y = vectors[len-1].y - vectors[len-2].y;

    let v5= new THREE.Vector2(-y, x);
    let v4 = new THREE.Vector2();

    v5.normalize();
    v4.copy(v5);
    
    x = v5.x*linewidth/2 + vectors[len-1].x;
    y = v5.y*linewidth/2 + vectors[len-1].y;
    v5.setX(x);
    v5.setY(y);
    Points1.push(v5);

    x = - v4.x*linewidth/2+vectors[len-1].x;
    y = - v4.y*linewidth/2+vectors[len-1].y;
    v4.setX(x);
    v4.setY(y);
    Points2.push(v4);

    var position = [];
    position.push(Points1);
    position.push(Points2);

    return position; 
}
function ptsToTriangleStrip(pts1,pts2){
    var position = [];
    var len = pts1.length;
    // for(var i=0;i<len-1;i++){
    //     position.push(pts1[i]);
    //     position.push(pts2[i+1]);
    // }

    for(var i=0;i<len;i++){
        position.push(pts1[i]);
        position.push(pts2[i]);
    }

    return position;
}


function ptsToTriangles(pts1,pts2){
    var position = [];
    var len = pts1.length;
    for(var i=0;i<len-1;i++){
        position.push(pts1[i]);
        position.push(pts2[i]);
        position.push(pts1[i+1]);

        position.push(pts2[i]);
        position.push(pts2[i+1]);
        position.push(pts1[i+1]);
    }
    return position;
}

/********************************************************************** */
//锐角相接
function sharpJoint(points,lineWidth,isGradient){
    // var pts = pointToVec(points);
    var pts = splitePolyline(points, 0.2);
    var ptTriangles = insertPoints(pts, lineWidth, isGradient);

    var TriStrip = [];
    TriStrip = ptsToTriangles(ptTriangles[0],ptTriangles[1]);
    TriStrip = toXYArray(TriStrip);
    return TriStrip;
}

//斜角相接
function bevelledJoint(points,lineWidth,isGradient){
    var pts = pointToVec(points);
    var pt_fan = [];

    var fan = getFan(pts,lineWidth);

    // points = splitePolyline(points,0.2);
    var arr = connectBeJoin(pts, lineWidth,isGradient);

    pt_fan.push(arr);
    pt_fan.push(fan);

    // arr.push(connectBeJoin(pts, lineWidth));
    //console.log(arr);
    return pt_fan;
}


//平角相接+圆帽相接
var connectBeJoin = function(array, lineWidth){
    var points = [];
    var triangleP = [];
    //起始节点处的处理
    let vec1 = new THREE.Vector2();
    let vec2 = new THREE.Vector2();

    vec1.subVectors(array[1],array[0]);//last to current 方向向量
    vec1.normalize();
    let normal1 = getNormal(vec1);

    let t1 = getXY(normal1, array[0], lineWidth);
    let t2 = getXY(normal1.negate(), array[0], lineWidth);
    points.push(t2);
    points.push(t1); 

    //中间节点处的斜接角
    let len = array.length;
    for(var i = 1; i< len -1; i++){
        var arr = bevelledJoin(array[i-1], array[i], array[i+1], lineWidth);
        points = points.concat(arr);
    }    

    //终止节点处的斜接角
    vec2.subVectors(array[len - 1],array[len - 2]);
    vec2.normalize();
    let normal2 = getNormal(vec2);
    let t3 = getXY(normal2, array[len - 1],lineWidth);
    let t4 = getXY(normal2.negate(), array[len -1],lineWidth);
    points.push(t3);
    points.push(t4);

    var len1 = points.length;
    for (var j = 0; j<len1 -3; j+=3){
        let arr1 = points.slice(j,j+5);
        
        let len2 = arr1.length;
        for (var k = 0; k< len2-4;k+=4){
            triangleP.push(arr1[k]);
            triangleP.push(arr1[k+1]);
            triangleP.push(arr1[k+2]);

            triangleP.push(arr1[k+1]);
            triangleP.push(arr1[k+3]);
            triangleP.push(arr1[k+2]);

            triangleP.push(arr1[k+2]);
            triangleP.push(arr1[k+3]);
            triangleP.push(arr1[k+4]);
        }
    }

    triangleP.concat([points[len1-2],points[len1-3],points[len1-1]]);
    triangleP.concat([points[len1-3],points[len1-4],points[len1-1]]);
    //triangleP.concat(points);


    triangleP = toXYArray(triangleP);

    return triangleP;
}

var fan = [];
    function getFan(array,lineWidth){
    let len = array.length;
    //中间节点处的斜接角
    for(var i = 1; i< len -1; i++){
        var arr = bevelledJoin(array[i-1], array[i], array[i+1], lineWidth);
        var arr2 = ArcJoin(array[i],arr[0],arr[2]);
        arr2 = toXYArray(arr2);
        fan.push(arr2);
    }
    return fan;
}

// function clockwise(p1, p2,p3){
//     var c = true;

//     let vec1 = new THREE.Vector2();
//     let vec2 = new THREE.Vector2();
//     //
//     vec1.subVectors(p2,p1);//last to current 方向向量
//     vec2.subVectors(p3,p2);

//     var sign = cro(vec1, vec2);
//     if(sign < 0){
//         return c;
//     }
//     else{
//         c = false;
//         return c;
//     }
// }

//由三个顶点的坐标得到中间点的插值点，顶点处的连接为斜角
//parameter:p1-p3为vector2类型的点
function bevelledJoin(p1, p2, p3, lineWidth){
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

    //判断折线的折叠方向
    //顺时针
    var sign = cro(vec1, vec2);
    let points;
    if (sign < 0){
        let normal1 = getNormal(vec1);
        let normal2 = getNormal(vec2);
        let miter = getNormal(vec3);
    
        let point1 = getXY(normal1, p2, lineWidth);
        let point2 = getXY(normal2, p2, lineWidth);
    
        let len = lineWidth/(normal1.dot(miter));
    
        let point3 = getXY(miter.negate(), p2, len);
        points = [point1, point3, point2];
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
        points = [point1, point3, point2];
    }
    return points;    
}

function toXYArray(points){
    var xy = [];
    var vectorToArray = function(item){
        xy.push(item.x);
        xy.push(item.y);
    }
    points.forEach(vectorToArray);
    return xy;
}


//逆时针旋转向量90°
function getNormal(point){
    let vec = new THREE.Vector2(-point.y, point.x); 
    return vec;
}

//二维向量叉乘
function cro(v1, v2){
    let x = v1.x * v2.y - v1.y * v2.x;
    return x;
}

//线段法向量上的插值点坐标
function getXY(normal, point,lineWidth){
    let x = normal.x * lineWidth/2 + point.x;
    let y = normal.y *lineWidth/2 + point.y;
    let vec = new THREE.Vector2(x, y);
    return vec;
}



//生成随机的点坐标
// 随机数生成
//paraa:cor:Vector2;
// var rand_constants = new THREE.Vector3(12.9898, 78.233, 4375.85453);
// function rand(co) {
//     var t = new THREE.Vector2();
//     t = co.dot(rand_constants.xy);
//     return fract(sin(t) * (rand_constants.z + t));
// }
// var xxx = function(){
//     console.log(rand(new THREE.Vector2(0.1,0.1)));
// }

// function initLine(){
//     let vector= [];
//     for (let i = 0; i<10; i++){
//         let x = Math.random();
//         let y = Math.random();   
//         let vec = new THREE.Vector2(x,y); 
//         vector.push(vec);
//     }
//     pts = vector;
// }


// var PS = [  0.5,0.0,  -0.8,-0.2,    0.4,-0.5,   -0.4,-0.2,  -0.5,-0.5, -0.8,0.2, 0.2, 0.6,   0.4,-0.8,  0.1,-0.9,    0.2, 0.2,   -0.1,-0.5,  -0.5, 0.9,  0.8,0.9]
// var pts = [];//用于测试的向量组
var PS = [-0.8,0.8,  -0.6,0.6,   -0.3,0.8,   0.1,0.4,  0.5,0.6,   0.9, -0.2,  0.8,-0.8  ,-0.2,-0.5,  -0.45, 0.2];

var pointToVec = function (points){
    var pts = [];
    for (var i = 0; i < points.length-1; i+=2){
        let p1 = new THREE.Vector2();
        p1.setX(points[i]);
        p1.setY(points[i+1]);
        pts.push(p1);
    }
    return pts;
}

// var initialize = function(PS,width){
    
//     var pts = pointToVec(PS);
//     var pt_fan = [];
//     var w = transform();
//     linewidth = w*width;

//     var fan = getFan(pts,linewidth);
//     var arr = connectBeJoin(pts, linewidth);

//     pt_fan.push(arr);
//     pt_fan.push(fan);

//     linewidth1 = 45*transform();
//     arr.push(connectBeJoin(pts, linewidth));

//     console.log(arr);

//     return pt_fan;
// }

var transform = function(){
    var canvas = document.getElementById("webgl");
    var clientboundary = canvas.getBoundingClientRect();
    var height = clientboundary.height;
    var width = clientboundary.width;
    var w = 1/width;
    var h = 1/height;
    if(w > h)
        return h;
    else
        return w;
}

//弧线相接的角
function ArcJoin(P, A, B){
    var pi = Math.PI;
    let vec1 = new THREE.Vector2();
    let vec2 = new THREE.Vector2();
    vec1.subVectors(A, P);
    vec2.subVectors(B, P);

    var LA = Math.sqrt(vec1.x * vec1.x + vec1.y * vec1.y);
    var LB = Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y);
    vec1.x/=LA;
    vec2.x/=LB;
    var angle1 = Math.acos(vec1.x);
    var angle2 = Math.acos(vec2.x);

    if(vec1.y<0){angle1 =- angle1;}
    if(vec2.y<0){angle2 =- angle2;}

    var array = innerArc(P, (LA+LB)/2, pi/36, angle1, angle2, A, B);
    // array = toXYArray(array);
    return array;
}

//根据角度算出位于弧顶的点的坐标
function innerArc(p, r, dangle, angle1,angle2,pt1,pt2){
    var incremental = true;
    var pi = Math.PI;

    if(angle2 > angle1){
        if(angle2 - angle1 > pi)
            angle2 = angle2 - 2*pi;
    }
    else{
        if(angle1 - angle2 > pi)
            angle1 = angle1 - 2*pi;
    }
    if(angle1 > angle2){
        incremental = false;
    }

    if(incremental){
        var points = [];
        points.push(p);
        for (var a = angle1; a<angle2; a+=dangle){
            let x = Math.cos(a);
            let y = Math.sin(a);
            let p1 = new THREE.Vector2(p.x+x*r, p.y+y*r);
            points.push(p1);
        }
        // points.push(pt2);
    }
    else{
        var points = [];
        points.push(p);
        for (let a = angle2; a <angle1; a += dangle){ 
            let x = Math.cos(a);
            let y = Math.sin(a);
            let p1 = new THREE.Vector2(p.x+x*r, p.y+y*r);
            points.push(p1);
        }
        // points.push(pt2);
    }
    return points;
}



/***************************************************************************** */
//this part for set different width for segment in different class
//得到线段的编号
//把相同等级的线段的坐标存储到同一个数组里面
//按照起止节点的顺序重新排列线段的顺序
//给每一等级的线分配相应的线宽，实现宽度的渐变


//test
function test(){
    //var classes = classifyData(data2);
    var classes = classifyData(data2);
    // var seg_arr = connectLines(classes[1]);

    var sourceIndex = findHead(classes[0]);
    getConnectLine(classes[0],sourceIndex[1]);
}

//把不同等级的河段分开存储
function classifyData(network){
    //var informations = [];
    var features = [];
    features = network.features;
    var len = features.length;
    // console.log(features);
    var class1 = [],class2 = [],class3 = [],class4 = []; class5 = [],class6 = [],classes = [];
    for (var i = 0; i<len; i++){
        let property;
        let streamlevel;
        //let coor = [];
        //coor = features[i].geometry.coordinates;
        streamlevel = features[i].properties.StreamLeve;

        switch(streamlevel){
            case 1:
            class1.push(features[i]);break;
            case 2:
            class2.push(features[i]);break;
            case 3:
            class3.push(features[i]);break;
            case 4:
            class4.push(features[i]);break;
            case 5:
            class5.push(features[i]);break;
            case 6:
            class6.push(features[i]);break;
        }
    }
    classes.push(class1);
    classes.push(class2);
    classes.push(class3);
    classes.push(class4);
    classes.push(class5);
    classes.push(class6);

    return classes;
}

//用于存放合并两条相邻的线段之后的线段和x新的起始点
 function segment(){
    this.start = 0;
    this.end = 0;
    this.segOrder = [];
 }

 segment.prototype.add = function(seg) {
    var len = seg.segOrder.length;
    for(var i = 0; i< len; i++){
        //console.log(this.segOrder);
        this.segOrder.push(seg.segOrder[i]);
    }
    //return this.segOrder;
}

 //获得从一个起始点出发的一整条线段
 //coors:所有同等级的线段的对象集合
 //index:是一个起始点在coors中的索引

// function connectLines(coors){
//     var len = coors.length ;
//     var seg_arr = [];//合并完成之后的线段集合

//     for (var k = 0; k<len; k++){
//         let seg = new segment();
//         seg.start = coors[k].properties.FromNode;
//         //console.log(coors[k].properties.FromNode);
//         seg.end = coors[k].properties.ToNode;
//         seg.segOrder.push(coors[k].geometry.coordinates);//记录线段的顺序
//         seg_arr.push(seg);
//     }
        
//     var len1 = seg_arr.length;
//     for (var i = 0; i< len1; i++){
//         var tn = seg_arr[i].end;
//         label:for (var j = 0; j<len1; j++){
//             var fn = seg_arr[j].start;
//             while(fn == tn){
//                 let seg = new segment();
//                 seg.start = seg_arr[i].start;
//                 seg.end = seg_arr[j].end;
//                 seg.segOrder = seg_arr[i].segOrder;
//                 seg.add(seg_arr[j]);
//                 seg_arr.splice(i,1);
//                 seg_arr.splice(j-1,1);
//                 seg_arr.push(seg);
//                 len1 = seg_arr.length;
//                 i = -1;
//                 break label;   
//             }     
//         }
//     }

//     var sum = 0;
//     for (var n = 0; n<seg_arr.length; n++){
//         sum+=seg_arr[n].segOrder.length;
//     }
//     if(sum != len){
//         console.log("error to connect lines");
//     }
//     console.log(seg_arr.length);
//     return seg_arr;
// }

 function getConnectLine(rank, index){
    var seg = new segment();
    var coors = rank;
    seg.start = coors[index].properties.FromNode;
    seg.end = coors[index].properties.ToNode;
    //console.log(seg.start,seg.end);
    seg.segOrder.push(getCoorVector2(coors[index].geometry.coordinates));
    coors.splice(index ,1);
    let len = coors.length;
    // let len = 5;
    for(let i =0; i<len; i++){
        if(coors[i].properties.FromNode == seg.end){
            //seg.start = startCode;
            seg.end = coors[i].properties.ToNode;
            //直接将点坐标转化为vetor2的形式
            seg.segOrder.push(getCoorVector2(coors[i].geometry.coordinates));
            coors.splice(i,1);
            i = -1;
            len = coors.length;
        }
    }

    // let allPt = [];
    // for(let i=0;i<seg.segOrder.length;i++ ){
    //     allPt = allPt.concat(seg.segOrder[i]);
    // }

    console.log(seg.segOrder);
    return seg.segOrder;
 }

//解析各等级的数据并进行线段排序
//parameter:kind,同等级的所有河段,
//注意：并不是所有的河段都是相互连接的，可能并不构成河网
function findHead(kind){

    var len = kind.length;
    var sourceIndex = [];

    //找到同等级的每条线段的起始点,没有终止节点与其匹配
    for(var j = 0; j <len; j++){
        var record = 0;
        var fn = kind[j].properties.FromNode;
        for(var k = 0; k < len; k++){
            var tn = kind[k].properties.ToNode;
            if (fn == tn){
                record += 1;
            }
        }
        if(record < 1){
            index = j;
            sourceIndex.push(j);
            console.log(kind[j].properties.FromNode);
        }
    }
    // console.log(sourceIndex)
    return sourceIndex;
}


/*********************************************************************************** */
//实现道格拉斯普克算法抽稀节点
//调用道格拉斯算法简化线节点
function simplify(){
    let coordinates = getlines(data2);
    getMapSize(coordinates);
    getRatio();
    console.log(coordinates);
    var pointsXY = [];
    var linewidth = 5 * ratio.r;

    var len = coordinates.length;
    for (var i = 0; i<len; i++){
        var line = coordinates[i];
        console.log(line);
        var res = getCoorVector2(line);
        var d = calculateDis(res[0],res[line.length-1]);
        console.log(d);
        if(line.length > 2){
            var result = douglasPeucker (res,0.0006);
        }
        res = insertPoints(result, linewidth);
        res = convertCor(res);  
        // console.log(res);
        for (var j = 0; j<res.length; j++){
            pointsXY.push(res[j]);
        }
    }
    console.log(pointsXY);
    return pointsXY;
}

//1计算两个点之间的距离
function calculateDis(point1,point2){
    let dis = Math.sqrt(Math.pow(point1.x-point2.x,2)+Math.pow(point1.y-point2.y,2));
    return dis;
}

//2计算中间点到ab起止直线段之间的距离
//利用海伦公式
function distToSegment(start, end, center){
    let a = calculateDis(start, end);
    let b = calculateDis(center, end);
    let c = calculateDis(start,center);
    let p = (a+b+c)/2;
    let S = Math.sqrt(Math.abs(p * (p - a) * (p - b) * (p - c)));
    return S * 2.0 / a;
}

//递归实现
function compressLine(coordinates, result, start , end,dMax){
    if(start < end){
        let maxDist = 0;
        let currrentIndex = 0;
        let startPoint = coordinates[start];
        let endPoint = coordinates[end];
        //找到线段的最远点
        for(let i = start + 1 ; i<end; i++){
            let currentDist = distToSegment(startPoint, endPoint, coordinates[i]);
            if(currentDist > maxDist){
                maxDist = currentDist;
                currrentIndex = i;
            }
        }
        if (maxDist >= dMax){
            //将最远点加入筛选后的数组
            result.push(coordinates[currrentIndex]);
            //以超过阈值的点为中心，将线段拆分成两段，分别对两段进行递归处理
            compressLine(coordinates,result,start ,currrentIndex,dMax);
            compressLine(coordinates,result,currrentIndex,end,dMax);
        }
    }
    return  result;
}

//daogelas算法
function douglasPeucker (coordinates,dMax){
    if (!coordinates || !(coordinates.length > 2)) {
        return null;
    }
    coordinates.forEach((item, index) => {
        item.id = index;
    });
    let len = coordinates.length;
    let result = compressLine(coordinates,[], 0, len-1, dMax);
    //将起止点加入到简化数组中
    result.push(coordinates[0]);
    result.push(coordinates[len-1]);

    //对保留下来的点按照索引值进行排序，确保点的顺序是按照原始数组排列
    let resCoor = result.sort((a,b) => {
        if(a.id < b.id){
            return -1;
        }
        else if(a.id>b.id){
            return 1;
        }
        return 0;
    });

    resCoor.forEach((item)=>{
        item.id = undefined;
    })
    console.result;
    return result;
}



//在线段的所有折点之间进行加密顶点的操作
function spliteSeg(start, end, threshold){
    var newSeg = [];
    // newSeg.push(start);
    var dis = calculateDis(start , end);
    if(dis > threshold){
        let x = (start.x + end.x)/2;
        let y = (start.y+end.y)/2;
        let central = new THREE.Vector2(x,y);
        let temp  = spliteSeg(start,central,threshold);
        newSeg = newSeg.concat(temp);
        temp = spliteSeg(central, end, threshold);
        let temp1 = temp.slice(1);
        newSeg = newSeg.concat(temp1);
        return newSeg;
    }
    newSeg.push(start, end);
    return newSeg;
}

function splitePolyline (pts,threshold){
    // var pts = pointToVec(originData);
    // console.log(pts);
    var result = [];
    for(let i =0; i<pts.length-1; i++){
        var temp = spliteSeg(pts[i], pts[i+1], threshold);
        if(i>0){
            result = result.concat(temp.slice(1));
        }
        if(i==0){
            result = result.concat(temp);
        }
    }
    // console.log(result);
    return result;
}

function gradientSeg(originData, linewidth, threshold, isGradient){
    var polyline = splitePolyline(originData,threshold);
    var stripPoint = insertPoints(polyline, linewidth, isGradient);
    stripPoint = ptsToTriangles(stripPoint[0], stripPoint[1])
    stripPoint = toXYArray(stripPoint);
    return stripPoint;
}

