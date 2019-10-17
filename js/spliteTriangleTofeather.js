var v_feather = `
attribute vec4 a_triPos;
attribute vec4 a_color;
varying vec4 v_color;
void main (){
gl_Position = a_triPos;
v_color = a_color;

}`;

var f_feather = `
precision mediump float;
varying vec4 v_color;
void main (){
    gl_FragColor = v_color;
    
}`;

function generateBevelledPoint(pts, line_width) {

    if (pts === undefined || pts.length < 2) {
        return undefined;
    }

    let res = [];

    let start_vector = new THREE.Vector3();
    start_vector.subVectors(pts[1], pts[0]);
    let left_miter = new THREE.Vector3();
    left_miter.crossVectors(new THREE.Vector3(0, 0, 1), start_vector);
    left_miter.normalize();
    left_miter.multiplyScalar(line_width);

    let right_miter = left_miter.clone();
    right_miter.multiplyScalar(-1.0);

    let left_point = new THREE.Vector3();
    let right_point = new THREE.Vector3();

    left_point.addVectors(pts[0], left_miter);
    right_point.addVectors(pts[0], right_miter);

    for (let i = 1; i < pts.length - 1; i++) {
        let pre_point = pts[i - 1];
        let current_point = pts[i];
        let next_point = pts[i + 1];

        let pre_vec = new THREE.Vector3();
        let next_vec = new THREE.Vector3();

        pre_vec.subVectors(current_point, pre_point);
        next_vec.subVectors(next_point, current_point);

        let direct = new THREE.Vector3();
        direct.crossVectors(pre_vec, next_vec);
        // direct is negative stand for clock-wise


        next_vec.multiplyScalar(-1.0);
        pre_vec.normalize();
        next_vec.normalize();

        let semi_vec = new THREE.Vector3();
        semi_vec.addVectors(pre_vec, next_vec);

        semi_vec.normalize();
        let semi_width = -line_width / Math.abs(semi_vec.x * next_vec.y - semi_vec.y * next_vec.x);

        semi_vec.multiplyScalar(semi_width);


        let semi_point = new THREE.Vector3();
        let pre_vec_point = new THREE.Vector3();
        let next_vec_point = new THREE.Vector3();

        if (direct.z > 0) {

            next_vec.crossVectors(new THREE.Vector3(0, 0, 1), next_vec);
            pre_vec.crossVectors(new THREE.Vector3(0, 0, -1), pre_vec);
        } else if (direct.z < 0) {

            next_vec.crossVectors(new THREE.Vector3(0, 0, -1), next_vec);
            pre_vec.crossVectors(new THREE.Vector3(0, 0, 1), pre_vec);
        } else {
            console.log("Direct equals to zero");
            //return [];
        }

        pre_vec.multiplyScalar(line_width);
        next_vec.multiplyScalar(line_width);

        semi_point.addVectors(current_point, semi_vec);
        pre_vec_point.addVectors(current_point, next_vec);
        next_vec_point.addVectors(current_point, pre_vec);

        if (direct.z > 0) {

            res.push(left_point, right_point, next_vec_point);
            res.push(left_point, next_vec_point, semi_point);
            res.push(next_vec_point, semi_point, pre_vec_point);
            left_point = semi_point;
            right_point = pre_vec_point;

        } else if (direct.z < 0) {
            res.push(left_point, right_point, next_vec_point);
            res.push(right_point, semi_point, next_vec_point);
            res.push(next_vec_point, semi_point, pre_vec_point);
            left_point = pre_vec_point;
            right_point = semi_point;
        } else {
            console.log("Direct equals to zero");
            //return [];
        }

    }


    let end_index = pts.length - 1;

    let end_vector = new THREE.Vector3();
    end_vector.subVectors(pts[end_index], pts[end_index - 1]);
    let end_vector_miter = new THREE.Vector3();
    end_vector_miter.crossVectors(new THREE.Vector3(0, 0, 1), end_vector);
    end_vector_miter.normalize();
    end_vector_miter.multiplyScalar(line_width);

    let left_end_point = new THREE.Vector3();
    let right_end_point = new THREE.Vector3();

    left_end_point.addVectors(pts[end_index], end_vector_miter);
    end_vector_miter.multiplyScalar(-1.0);
    right_end_point.addVectors(pts[end_index], end_vector_miter);

    res.push(left_point, right_point, right_end_point);
    res.push(left_point, right_end_point, left_end_point);
    return res;
}

//斜角的反走样
function spliteTriangle(guiObj, originData) {
    var pointsCoor = [];
    var originCoor = getCoorVector2(originData);
    var lineWidth = transform() * guiObj.width;

    pointsCoor = splitePolyline(originData, 0.1);
    var insertCoor = insertPoints(pointsCoor, lineWidth, guiObj.gradient);

    var twoTiangleStrip = getTwoTriangleStrip(insertCoor, pointsCoor);
    drawTwinLine(twoTiangleStrip, guiObj);



    function drawTwinLine(twoTiangleStrip, guiObj) {

        var gl = getContextgl();
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var program = createProgram(gl, v_feather, f_feather);
        gl.useProgram(program.program);

        var array = [];
        array = twoTiangleStrip;
        console.log(array);
        var colorArr = [];

        for (var i = 0; i < array[0].length / 2; i++) {
            colorArr = colorArr.concat(0, 0, 1, 1);
        }
        console.log(colorArr.length);


        var vertexBuffer = createBuffer(gl, new Float32Array(array[0]));
        bindAttribute(gl, vertexBuffer, program.a_triPos, 2);


        if (guiObj.feather) {
            var colorBuffer = createBuffer(gl, new Float32Array(array[1]));
            bindAttribute(gl, colorBuffer, program.a_color, 4);
            var n = array[0].length / 2;
            gl.drawArrays(gl.TRIANGLES, 0, n);
        } else {
            var colorBuffer = createBuffer(gl, new Float32Array(colorArr));
            bindAttribute(gl, colorBuffer, program.a_color, 4)
            var n = array[0].length / 2;
            gl.drawArrays(gl.TRIANGLES, 0, n);
        }


    }
}

function addColortoFeatherVertex(shallow, deep, deepClr, shallowClr) {
    var FeatherStrip = {};
    var featherstrip = [];
    var color = [];

    var len = shallow.length;
    if (len < 3) {
        for (var i = 0; i < len - 1; i++) {
            featherstrip.push(shallow[i]);
            featherstrip.push(deep[i]);
            featherstrip.push(shallow[i + 1]);
            featherstrip.push(deep[i + 1]);
            for (var j = 0; j < 2; j++) {
                color = color.concat(shallowClr)
                color = color.concat(deepClr);
            }
        }
    } else {
        for (var i = 0; i < len - 1; i++) {
            featherstrip.push(shallow[i]);
            featherstrip.push(deep[i]);
            featherstrip.push(shallow[i + 1]);
            featherstrip.push(deep[i]);
            featherstrip.push(shallow[i + 1]);
            featherstrip.push(deep[i + 1]);
            for (var j = 0; j < 3; j++) {
                color = color.concat(shallowClr)
                color = color.concat(deepClr);
            }
        }
    }
    FeatherStrip.triangleStrip = toXYArray(featherstrip);
    // FeatherStrip.triangleStrip = featherstrip;

    FeatherStrip.colorArr = color;

    return FeatherStrip;
}


//平角、斜角以及圆角的反走样
function threeAntialiased(gl, originData, gui_object) {
    var dataVectors = pointToVec(originData);
    var insertCoor = {}; //存放四条线的坐标，一共三条三角形坐标条带
    let shallowClr = [0.5, 0.5, 0.5, 1];
    let deepClr = [1, 1, 1, 1];
    // let gl = getContextgl();

    //向右平移获得绘制平角的坐标
    let originData1 = [];
    for (let i = 0; i < dataVectors.length; i++) {
        let x = dataVectors[i].x + 0.2;
        let y = dataVectors[i].y;
        let pt = new THREE.Vector2(x, y);
        originData1.push(pt);
    }

    //获得绘制圆角的坐标
    let originData2 = [];
    for (let i = 0; i < dataVectors.length; i++) {
        let x = dataVectors[i].x + 0.4;
        let y = dataVectors[i].y;
        let pt = new THREE.Vector2(x, y);
        originData2.push(pt);
    }



    var boundary = getMapSize(getlines(simpleData));
    var ratio = getRatio(boundary);
    var linewidth = gui_object.width * ratio / 1000;
    var featherWidth = linewidth;

    if (gui_object.joint == "miter") {
        draw_Sharp_Joint(gl, originData, gui_object);
    }
    if (gui_object.joint == "bevel") {
        draw_BevelledJoint(gl, originData1, gui_object);
    }
    if (gui_object.joint == "round") {
        draw_ArcJoint(gl, originData1, gui_object);
    }

    function draw_BevelledJoint(gl, data, guiObj) {
        let twoLineCoor = getTwoWholeLine(data, linewidth);
        insertCoor.left = twoLineCoor.left;
        insertCoor.right = twoLineCoor.right;

        twoLineCoor = getTwoWholeLine(data, linewidth + featherWidth);
        insertCoor.leftFeather = twoLineCoor.left;
        insertCoor.rightFeather = twoLineCoor.right;

        let leftStrip = addColortoFeatherVertex(insertCoor.leftFeather, insertCoor.left, shallowClr, deepClr);
        let rightStrip = addColortoFeatherVertex(insertCoor.rightFeather, insertCoor.right, shallowClr, deepClr);
        let centralStrip = connectBeJoin(data, linewidth);


        let points = [];
        for (let i = 0; i < data.length; i++) {
            let pt = new THREE.Vector3(data[i].x, data[i].y, 0);
            points.push(pt);
        }
        let triangles = generateBevelledPoint(points, linewidth / 2);
        let color = [];
        let clr = new Color(0.5, 0.5, 0.5, 1);
        for (let i = 0; i < triangles.length; i++) {
            color.push(clr);
        }

        draw_Cap(gl, data, linewidth, featherWidth, guiObj);

        drawlineSequence(gl, triangles, color, 4);

        //中心线和左右羽化边缘
        // draw_Bevelled_Feather(gl,centralStrip, leftStrip, rightStrip);
        draw_Bevelled_Feather(gl, undefined, leftStrip, rightStrip);
    }

    function draw_ArcJoint(gl, data, guiObj) {
        let twoLineCoor = roundCorner(data, linewidth);
        insertCoor.left = twoLineCoor.left;
        insertCoor.right = twoLineCoor.right;
        let centralFan = getFan(data, linewidth);

        twoLineCoor = roundCorner(data, linewidth + featherWidth);
        insertCoor.leftFeather = twoLineCoor.left;
        insertCoor.rightFeather = twoLineCoor.right;

        let leftStrip = addColortoFeatherVertex(insertCoor.leftFeather, insertCoor.left, shallowClr, deepClr);
        let rightStrip = addColortoFeatherVertex(insertCoor.rightFeather, insertCoor.right, shallowClr, deepClr);
        let centralStrip = connectBeJoin(data, linewidth);

        let points = [];
        for (let i = 0; i < data.length; i++) {
            let pt = new THREE.Vector3(data[i].x, data[i].y, 0);
            points.push(pt);
        }
        let triangles = generateBevelledPoint(points, linewidth / 2);
        let color = [];
        let clr = new Color(0.5, 0.5, 0.5, 1);
        for (let i = 0; i < triangles.length; i++) {
            color.push(clr);
        }

        draw_Cap(gl, data, linewidth, featherWidth, guiObj);
        drawlineSequence(gl, triangles, color, 4);
        draw_Bevelled_Feather(gl, centralStrip, leftStrip, rightStrip, centralFan);
    }

    function roundCorner(originData, lineWidth) {
        var twoRoundLine = {};
        var pt_lft = [];
        var pt_rht = [];
        let central_fan = [];

        //起始节点处的处理
        let vec1 = new THREE.Vector2();
        let vec2 = new THREE.Vector2();
        vec1.subVectors(originData[1], originData[0]); //last to current 方向向量
        vec1.normalize();
        let normal1 = getNormal(vec1);

        let t1 = getXY(normal1, originData[0], lineWidth);
        let t2 = getXY(normal1.negate(), originData[0], lineWidth);
        pt_lft.push(t1);
        pt_rht.push(t2);

        let len = originData.length;

        for (var i = 1; i < len - 1; i++) {

            let v1 = new THREE.Vector2();
            let v2 = new THREE.Vector2();

            v1.subVectors(originData[i], originData[i - 1]); //last to current 方向向量
            v2.subVectors(originData[i + 1], originData[i]);

            let arr = bevelledJoin(originData[i - 1], originData[i], originData[i + 1], lineWidth);
            let arr2 = ArcJoin(originData[i], arr[0], arr[2]);
            arr2 = toXYArray(arr2);
            let arr3 = arr2.slice(2);
            // let arr3 = arr2;
            central_fan.push(arr2);

            let sign = cro(v1, v2);
            if (sign < 0) {
                //console.log(arr3);
                let arr4 = (pointToVec(arr3)).reverse();
                pt_lft = pt_lft.concat(arr4);
                //console.log(arr3);
                pt_rht.push(arr[1]); //插入折角内侧的插值点
            } else {
                pt_lft.push(arr[1]);
                pt_rht = pt_rht.concat(pointToVec(arr3)); //插入折角内侧的插值点
            }
        }

        vec2.subVectors(originData[len - 1], originData[len - 2]);
        vec2.normalize();
        let normal2 = getNormal(vec2);
        let t3 = getXY(normal2, originData[len - 1], lineWidth);
        let t4 = getXY(normal2.negate(), originData[len - 1], lineWidth);
        pt_lft.push(t3);
        pt_rht.push(t4);


        twoRoundLine.left = pt_lft;
        twoRoundLine.right = pt_rht;
        twoRoundLine.fan = central_fan;
        return twoRoundLine;
    }

    function getThreeVertexOfBothSide(p1, p2, p3, lineWidth) {
        let vec1 = new THREE.Vector2();
        let vec2 = new THREE.Vector2();
        let vec3 = new THREE.Vector2();

        //
        vec1.subVectors(p2, p1); //last to current 方向向量
        vec1.normalize();
        vec2.subVectors(p3, p2);
        vec2.normalize();
        vec3.addVectors(vec1, vec2);
        vec3.normalize();

        let points = {};
        //判断折线的折叠方向
        //顺时针
        var sign = cro(vec1, vec2);
        if (sign < 0) {
            let normal1 = getNormal(vec1);
            let normal2 = getNormal(vec2);
            let miter = getNormal(vec3);

            let point1 = getXY(normal1, p2, lineWidth);
            let point2 = getXY(normal2, p2, lineWidth);

            let len = lineWidth / (normal1.dot(miter));

            let point3 = getXY(miter.negate(), p2, len);
            // var points = [point1, point3, point2];
            points.left = [point1, point2];
            points.right = point3;
        }
        //逆时针
        else {
            let normal1 = getNormal(vec1);
            let normal2 = getNormal(vec2);
            let miter = getNormal(vec3);

            let point1 = getXY(normal1.negate(), p2, lineWidth);
            let point2 = getXY(normal2.negate(), p2, lineWidth);

            let len = lineWidth / (normal1.dot(miter));

            let point3 = getXY(miter.negate(), p2, len);
            // var points = [point1, point3, point2];
            points.right = [point1, point2];
            points.left = point3;

        }
        return points;
    }

    function getTwoWholeLine(originData, lineWidth) {
        var points = {}; //存储线段的左右两边的插值点
        var pt_lft = [];
        var pt_rht = [];

        //起始节点处的处理
        let vec1 = new THREE.Vector2();
        let vec2 = new THREE.Vector2();

        vec1.subVectors(originData[1], originData[0]); //last to current 方向向量
        vec1.normalize();
        let normal1 = getNormal(vec1);

        let t1 = getXY(normal1, originData[0], lineWidth);
        let t2 = getXY(normal1.negate(), originData[0], lineWidth);
        pt_lft.push(t1);
        pt_rht.push(t2);

        //中间节点处的斜接角
        let len = originData.length;
        for (var i = 1; i < len - 1; i++) {
            var arr = getThreeVertexOfBothSide(originData[i - 1], originData[i], originData[i + 1], lineWidth);
            var bool_lft = arr.left instanceof Array;
            var bool_rht = arr.right instanceof Array;
            //console.log(bool);
            if (bool_lft) {
                pt_lft = pt_lft.concat(arr.left);
            } else {
                pt_lft.push(arr.left);
            }
            if (bool_rht) {
                pt_rht = pt_rht.concat(arr.right);
            } else {
                pt_rht.push(arr.right);
            }
        }

        //终止节点处的斜接角
        vec2.subVectors(originData[len - 1], originData[len - 2]);
        vec2.normalize();
        let normal2 = getNormal(vec2);
        let t3 = getXY(normal2, originData[len - 1], lineWidth);
        let t4 = getXY(normal2.negate(), originData[len - 1], lineWidth);
        pt_lft.push(t3);
        pt_rht.push(t4);

        points.left = pt_lft;
        points.right = pt_rht;

        return points;
    }

    //绘制三条三角形带(添加羽化)
    function draw_Bevelled_Feather(gl, centralStrip, leftStrip, rightStrip, centralFan) {
        var program = createProgram(gl, v_feather, f_feather);
        gl.useProgram(program.program);

        // var centralBuffer = createBuffer(gl,new Float32Array(centralStrip));
        // var colorArray = [];
        // for(var i =0; i<centralStrip.length/2; i++){
        //     colorArray = colorArray.concat([0,0,0,1]);
        // }
        // bindAttribute(gl,centralBuffer,program.a_triPos,2);  
        // var colorBuffer = createBuffer(gl,new Float32Array(colorArray));

        // bindAttribute(gl, colorBuffer,program.a_color,4);
        // var n = centralStrip.length/2;
        //console.log(gl.TRIANGLE_FAN);
        // gl.drawArrays(gl.TRIANGLES,0,n);


        if (typeof centralFan != 'undefined') {
            var colorArray = [];
            let len = centralFan.length;
            for (var j = 0; j < len; j++) {
                for (var i = 0; i < centralFan[j].length / 2; i++) {
                    colorArray = colorArray.concat([0.5, 0.5, 0.5, 1]);
                }

                var fanBuffer = createBuffer(gl, new Float32Array(centralFan[j]));
                bindAttribute(gl, fanBuffer, program.a_triPos, 2);
                var colorBuffer = createBuffer(gl, new Float32Array(colorArray));
                bindAttribute(gl, colorBuffer, program.a_color, 4);

                var n = centralFan[j].length / 2;
                gl.drawArrays(gl.TRIANGLE_FAN, 0, n);

            }
        }

        //羽化
        if (gui_object.feather) {
            var triangleBuffer = createBuffer(gl, new Float32Array(leftStrip.triangleStrip));
            var colorBuffer1 = createBuffer(gl, new Float32Array(leftStrip.colorArr));
            bindAttribute(gl, triangleBuffer, program.a_triPos, 2);
            bindAttribute(gl, colorBuffer1, program.a_color, 4);
            var num = leftStrip.triangleStrip.length / 2;
            gl.drawArrays(gl.TRIANGLES, 0, num);


            triangleBuffer = createBuffer(gl, new Float32Array(rightStrip.triangleStrip));
            colorBuffer1 = createBuffer(gl, new Float32Array(rightStrip.colorArr));
            bindAttribute(gl, triangleBuffer, program.a_triPos, 2);
            bindAttribute(gl, colorBuffer1, program.a_color, 4);
            num = rightStrip.triangleStrip.length / 2;
            gl.drawArrays(gl.TRIANGLES, 0, num);
        }
    }


    function draw_Sharp_Joint(gl, originData, guiObj) {
        // var dataVectors = pointToVec(originData);
        var insertCoor = {};

        var twoPointsArray = insertPoints(dataVectors, linewidth, guiObj.gradient);
        var res = insertPoints(twoPointsArray[0], featherWidth, false);
        var leftFeatherArray = res[0];
        res = insertPoints(twoPointsArray[1], featherWidth, false);
        var rightFeatherArray = res[1];


        insertCoor.left = twoPointsArray[0];
        insertCoor.right = twoPointsArray[1];
        insertCoor.leftFeather = leftFeatherArray;
        insertCoor.rightFeather = rightFeatherArray;

        var centralLine = toXYArray(ptsToTriangles(insertCoor.left, insertCoor.right));
        var centralTriangle = toXYArray(ptsToTriangleStrip(insertCoor.left, insertCoor.right));
        var leftstrip = addColortoFeatherVertex(insertCoor.leftFeather, insertCoor.left, shallowClr, deepClr);
        var rightstrip = addColortoFeatherVertex(insertCoor.rightFeather, insertCoor.right, shallowClr, deepClr);

        drawTheFeather(gl, centralLine, leftstrip, rightstrip, centralTriangle, guiObj);
        draw_Cap(gl, dataVectors, linewidth, featherWidth, guiObj);

        function drawTheFeather(gl, centralLine, leftStrip, rightStrip, centralTriangle, guiObj) {
            // gl.clearColor( 1,1,1,1);
            // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            var program = createProgram(gl, v_feather, f_feather);
            gl.useProgram(program.program);


            // gl.enable(gl.BLEND);
            // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


            var centralBuffer = createBuffer(gl, new Float32Array(centralLine));
            // gl.uniform1i(program.u_type,1);
            var colorArray = [];
            for (var i = 0; i < centralLine.length / 2; i++) {
                colorArray = colorArray.concat([0.5, 0.5, 0.5, 1]);
            }
            bindAttribute(gl, centralBuffer, program.a_triPos, 2);
            var colorBuffer = createBuffer(gl, new Float32Array(colorArray));

            bindAttribute(gl, colorBuffer, program.a_color, 4);
            // gl.uniform4fv(program.u_centralClr,[0,0,1,0]);
            var n = centralLine.length / 2;
            gl.drawArrays(gl.TRIANGLES, 0, n);


            if (guiObj.feather) {
                var triangleBuffer = createBuffer(gl, new Float32Array(leftStrip.triangleStrip));
                var colorBuffer1 = createBuffer(gl, new Float32Array(leftStrip.colorArr));

                bindAttribute(gl, triangleBuffer, program.a_triPos, 2);
                bindAttribute(gl, colorBuffer1, program.a_color, 4);
                var num = leftstrip.triangleStrip.length / 2;
                console.log(num);
                gl.drawArrays(gl.TRIANGLES, 0, num);

                triangleBuffer = createBuffer(gl, new Float32Array(rightStrip.triangleStrip));
                colorBuffer1 = createBuffer(gl, new Float32Array(rightStrip.colorArr));
                // gl.uniform1i(program.u_type,0);
                bindAttribute(gl, triangleBuffer, program.a_triPos, 2);
                bindAttribute(gl, colorBuffer1, program.a_color, 4);
                num = rightStrip.triangleStrip.length / 2;
                gl.drawArrays(gl.TRIANGLES, 0, num);
                console.log(num);

            }


            if (guiObj.triangle) {
                var centralBuffer1 = createBuffer(gl, new Float32Array(centralTriangle));
                var colorArray1 = [];
                for (var i = 0; i < centralTriangle.length / 2; i++) {
                    colorArray1 = colorArray1.concat([1, 0, 0, 1]);
                }
                bindAttribute(gl, centralBuffer1, program.a_triPos, 2);
                var colorBuffer1 = createBuffer(gl, new Float32Array(colorArray1));

                bindAttribute(gl, colorBuffer1, program.a_color, 4);
                let number = centralTriangle.length / 2;
                gl.drawArrays(gl.LINE_STRIP, 0, number);

            }
        }
    }

}




/*
绘制线cap,buttcap不用在线的端头处生成cap
*/
function createRoundCap(points, radius) {
    const pi = Math.PI;
    let cap = {};
    let vec1 = new THREE.Vector2();
    let vec2 = new THREE.Vector2();


    let startCap = [];
    let endCap = [];
    let start_arc = [];
    let end_arc = [];
    let color = new Color(0.5, 0.5, 0.5, 1),
        startClrArr = [],
        endClrArr = [];

    startCap.push(points[0]);
    endCap.push(points[points.length - 1]);
    const num = 180;
    for (let i = 0; i < num + 1; i++) {
        vec1.subVectors(points[0], points[1]);
        vec1.normalize();
        vec2 = getNormal(vec1);

        let cosin = Math.cos(pi / num * i);
        let sin = Math.sin(pi / num * i);
        let x = vec1.x * sin + vec2.x * cosin;
        let y = vec1.y * sin + vec2.y * cosin;

        let vec_pt = new THREE.Vector2(x, y);
        let pt = getXY(vec_pt, points[0], radius);
        startCap.push(pt);
        start_arc.push(pt);

        vec1.subVectors(points[points.length - 1], points[points.length - 2]);
        vec1.normalize();
        vec2 = getNormal(vec1);

        x = vec1.x * sin + vec2.x * cosin;
        y = vec1.y * sin + vec2.y * cosin;
        vec_pt.setX(x);
        vec_pt.setY(y);

        pt = getXY(vec_pt, points[points.length - 1], radius);
        endCap.push(pt);
        end_arc.push(pt);
    }
    for (let i = 0; i < startCap.length; i++) {
        startClrArr.push(color);
    }
    for (let i = 0; i < endCap.length; i++) {
        endClrArr.push(color);
    }
    cap.startCap = startCap;
    cap.endCap = endCap;
    cap.startClrArr = startClrArr;
    cap.endClrArr = endClrArr;
    cap.start_arc = start_arc;
    cap.end_arc = end_arc;

    return cap;
}


//startCap:TRIANGLE_STRIP
function createSquareCap(points, width) {
    let startCap = [],
        endCap = [],
        color, clrArr = [];

    let vec1 = new THREE.Vector2();
    let vec2 = new THREE.Vector2();
    vec1.subVectors(points[0], points[1]);
    vec1.normalize();
    vec2 = getNormal(vec1);


    let p1 = getXY(vec2, points[0], width);
    let p2 = getXY(vec1, p1, width);
    let p3 = getXY(vec2.negate(), points[0], width);
    let p4 = getXY(vec1, p3, width);

    startCap.push(p1, p2, p3, p4);
    let line_start = [p1, p2, p4, p3];

    vec1.subVectors(points[points.length - 1], points[points.length - 2]);
    vec1.normalize();
    vec2 = getNormal(vec1);

    p1 = getXY(vec2, points[points.length - 1], width);
    p2 = getXY(vec1, p1, width);
    p3 = getXY(vec2.negate(), points[points.length - 1], width);
    p4 = getXY(vec1, p3, width);

    endCap.push(p1, p2, p3, p4);
    let line_end = [p1, p2, p4, p3];


    //首尾线帽的颜色
    color = new Color(0.5, 0.5, 0.5, 1);
    for (let i = 0; i < startCap.length; i++) {
        clrArr.push(color);
    }

    let SquareCap = {};

    SquareCap.startCap = startCap;
    SquareCap.endCap = endCap;
    SquareCap.clrArr = clrArr;
    SquareCap.startLine = line_start;
    SquareCap.endLine = line_end;

    return SquareCap;
}


function vec2Tovec3(vectors) {
    let result_vecs = [];
    for (let i = 0; i < vectors.length; i++) {
        let v = new THREE.Vector3(vectors[i].x, vectors[i].y, 0);
        result_vecs.push(v);
    }
    return result_vecs;
}

function draw_Cap(gl, vec, linewidth, featherwidth, lineGui) {
    if (lineGui.cap === "butt") {
        return;
    }
    if (lineGui.cap === "round") {
        let startRoundCap = [];
        let endRoundCap = [];

        let cap = createRoundCap(vec, linewidth);
        startRoundCap = cap.startCap;
        endRoundCap = cap.endCap;
        let color_start = cap.startClrArr;
        let color_end = cap.endClrArr;

        startRoundCap = vec2Tovec3(startRoundCap);
        endRoundCap = vec2Tovec3(endRoundCap);
        // console.log(gl.TRIANGLE_FAN);
        drawlineSequence(gl, startRoundCap, color_start, 6);
        drawlineSequence(gl, endRoundCap, color_end, 6);

        if (lineGui.feather) {
            let cap_feather = createRoundCap(vec, linewidth + featherwidth);
            let FeatherStrip = draw_Cap_Feather(cap.start_arc, cap_feather.start_arc, new Color(0.5, 0.5, 0.5, 1), new Color(1, 1, 1, 1));
            drawlineSequence(gl, FeatherStrip.triangleStrip, FeatherStrip.colorArr, 5);

            FeatherStrip = draw_Cap_Feather(cap.end_arc, cap_feather.end_arc, new Color(0.5, 0.5, 0.5, 1), new Color(1, 1, 1, 1));
            drawlineSequence(gl, FeatherStrip.triangleStrip, FeatherStrip.colorArr, 5);
        }
    }

    if (lineGui.cap === "square") {
        let startSquareCap = [];
        let endSquareCap = [];
        let color = [];

        let SquareCap = createSquareCap(vec, linewidth);
        color = SquareCap.clrArr;
        startSquareCap = vec2Tovec3(SquareCap.startCap);
        endSquareCap = vec2Tovec3(SquareCap.endCap);
        drawlineSequence(gl, startSquareCap, color, 5);
        drawlineSequence(gl, endSquareCap, color, 5);

        if (lineGui.feather) {
            let cap_feather = createSquareCap(vec, linewidth + featherwidth);
            let FeatherStrip = draw_Cap_Feather(SquareCap.startLine, cap_feather.startLine, new Color(0.5, 0.5, 0.5, 1), new Color(1, 1, 1, 1));
            drawlineSequence(gl, FeatherStrip.triangleStrip, FeatherStrip.colorArr, 5);

            console.log(cap_feather.endLine);
            FeatherStrip = draw_Cap_Feather(SquareCap.endLine, cap_feather.endLine, new Color(0.5, 0.5, 0.5, 1), new Color(1, 1, 1, 1));
            drawlineSequence(gl, FeatherStrip.triangleStrip, FeatherStrip.colorArr, 5);
        }
    }
}

function draw_Cap_Feather(deepArr, shallowArr, deepClr, shallowClr) {
    let FeatherStrip = {};
    let featherstrip = [];
    let color = [];

    let deep = vec2Tovec3(deepArr);
    let shallow = vec2Tovec3(shallowArr);

    let len = shallow.length;
    // if(len<2){
    //     return ;
    // }
    if (len < 3) {
        for (let i = 0; i < len - 1; i++) {
            featherstrip.push(shallow[i]);
            featherstrip.push(deep[i]);
            featherstrip.push(shallow[i + 1]);
            featherstrip.push(deep[i + 1]);
            for (let j = 0; j < 2; j++) {
                color = color.concat(shallowClr)
                color = color.concat(deepClr);
            }
        }
    } else {
        for (let i = 0; i < len; i++) {
            featherstrip.push(shallow[i]);
            featherstrip.push(deep[i]);
            color = color.concat(shallowClr);
            color = color.concat(deepClr);
        }
    }
    FeatherStrip.triangleStrip = featherstrip;

    FeatherStrip.colorArr = color;

    return FeatherStrip;

}

//改变线帽和线连接方式的河网表达之数据准备
function get_ready_coor(data, gui_obj) {
    var boundary = getMapSize(getlines(data));
    var ratio = getRatio(boundary);
    console.log(boundary);

    let pts_arr1 = data.features[0].geometry.coordinates;
    let pts_arr2 = data.features[1].geometry.coordinates;
    let pts_arr3 = data.features[2].geometry.coordinates;

    let pts1 = [];
    pts_arr1.forEach((item) => {
        let vec = new THREE.Vector2(item[0], item[1]);
        pts1.push(vec);
    });

    let pts2 = [];
    pts_arr2.forEach((item) => {
        let vec = new THREE.Vector2(item[0], item[1]);
        pts2.push(vec);
    });

    let pts3 = [];

    pts_arr3.forEach((item) => {
        let vec = new THREE.Vector2(item[0], item[1]);
        pts3.push(vec);
    });

    if (gui_obj.simplify) {
        pts_arr1 = convertCor(douglasPeucker(pts1, 50), boundary);
        pts_arr2 = convertCor(douglasPeucker(pts2, 50), boundary);
        pts_arr3 = convertCor(douglasPeucker(pts3, 50), boundary);
    } else {
        pts_arr1 = convertCor(pts1, boundary);
        pts_arr2 = convertCor(pts2, boundary);
        pts_arr3 = convertCor(pts3, boundary);
        console.log(pts_arr1);
    }

    let coors = [];

    coors.push(pts_arr1);
    coors.push(pts_arr2);
    coors.push(pts_arr3);

    //console.log(coors);
    return coors;
}