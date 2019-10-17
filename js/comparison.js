//比较不同绘制方式下的绘制效率的高低


var vs = `
attribute vec4 a_triPos;
attribute vec4 a_color;
varying vec4 v_color;
void main (){
gl_Position = a_triPos;
v_color = a_color;

}`;

var fs = `
precision mediump float;
varying vec4 v_color;
void main (){
    gl_FragColor = v_color;
}`;

function addColorToPts(pts) {
    let color = new Color(0, 0, 0, 1);
    let colors = [];
    pts.forEach(element => {
        colors.push(color);
    });
    return colors;
}

function gl_draw_with_color(gl, coordinate, color, drawType) {
    const program = createProgram(gl, vs, fs);
    gl.useProgram(program.program);
    const aLine = [];
    coordinate.forEach((item) => {
        aLine.push(item.x, item.y);
    });

    // Assume the length of coordinate equals to the length of color
    const colorArr = [];
    color.forEach((item) => {
        colorArr.push(item.r, item.g, item.b, item.alpha);
    });
    var colorbuff = createBuffer(gl, new Float32Array(colorArr));
    bindAttribute(gl, colorbuff, program.a_color, 4);
    var lineBuffer = createBuffer(gl, new Float32Array(aLine));
    bindAttribute(gl, lineBuffer, program.a_Pos, 2);
    var n = coordinate.length;
    gl.drawArrays(drawType, 0, n);
}

function comparison(originData, is_feather, type) {
    // var dataVectors = pointToVec(originData);
    // var insertCoor = {};//存放四条线的坐标，一共三条三角形坐标条带
    let shallowClr = new Color(0.5, 0.5, 0.5, 1);
    let deepClr = new Color(1, 1, 1, 1);
    let gl = getContextgl();

    var linewidth = 20 * transform();
    var featherWidth = linewidth;

    if (type == 'origin') {
        draw_in_line(gl, originData);
    } else if (type == 'miter') {
        draw_Sharp_Joint(gl, originData, is_feather);
    } else if (type == 'bevel') {
        draw_BevelledJoint(gl, originData, is_feather);
    } else
        draw_ArcJoint(gl, originData, is_feather);

    function draw_in_line(gl, data) {
        let color = addColorToPts(data);
        gl_draw_with_color(gl, data, color, 2);
    }

    function draw_BevelledJoint(gl, data, feather) {
        let twoLineCoor = getTwoWholeLine(data, linewidth);
        let twoLineCoor_1 = getTwoWholeLine(data, linewidth + featherWidth);

        let leftStrip = addColortoFeatherVertex(twoLineCoor_1.left, twoLineCoor.left, shallowClr, deepClr);
        let rightStrip = addColortoFeatherVertex(twoLineCoor_1.right, twoLineCoor.right, shallowClr, deepClr);

        let points = [];
        for (let i = 0; i < data.length; i++) {
            let pt = new THREE.Vector3(data[i].x, data[i].y, 0);
            points.push(pt);
        }
        let triangles = generateBevelledPoint(points, linewidth / 2);
        let color = addColorToPts(triangles);

        console.log(triangles.length / 3);
        gl_draw_with_color(gl, triangles, color, 4);

        //中心线和左右羽化边缘
        if (feather) {
            draw_Bevelled_Feather(gl, leftStrip, rightStrip);
        }
    }

    function draw_ArcJoint(gl, data, feather) {
        let twoLineCoor = roundCorner(data, linewidth);
        let twoLineCoor_1 = roundCorner(data, linewidth + featherWidth);

        let leftStrip = addColortoFeatherVertex(twoLineCoor_1.left, twoLineCoor.left, shallowClr, deepClr);
        let rightStrip = addColortoFeatherVertex(twoLineCoor_1.right, twoLineCoor.right, shallowClr, deepClr);

        let central_Fan = getFan(data, linewidth);

        let centralFan = [];
        let fan_color = [];
        central_Fan.forEach(item => {
            let arr = pointToVec(item);
            let colors = addColorToPts(arr);
            centralFan.push(arr);
            fan_color.push(colors);
        })

        let points = [];
        for (let i = 0; i < data.length; i++) {
            let pt = new THREE.Vector3(data[i].x, data[i].y, 0);
            points.push(pt);
        }
        let triangles = generateBevelledPoint(points, linewidth / 2);
        let color = [];
        let clr = new Color(0, 0, 0, 1);
        for (let i = 0; i < triangles.length; i++) {
            color.push(clr);
        }

        // console.log(triangles.length/3);
        gl_draw_with_color(gl, triangles, color, 4); //draw central line

        // let num = 0;
        for (let i = 0; i < centralFan.length; i++) {
            gl_draw_with_color(gl, centralFan[i], fan_color[i], 4); //draw the corner fan
            // console.log(centralFan[i])
            // num = num + centralFan[i].length;
            // console.log(num);

        }
        console.log(triangles.length / 3 + num / 3);


        if (feather) {
            draw_Bevelled_Feather(gl, leftStrip, rightStrip);
        }
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
    function draw_Bevelled_Feather(gl, leftStrip, rightStrip) {
        //羽化
        if (leftStrip !== undefined && rightStrip !== undefined) {
            gl_draw_with_color(gl, leftStrip.triangleStrip, leftStrip.colorArr, 4);
            gl_draw_with_color(gl, rightStrip.triangleStrip, rightStrip.colorArr, 4);
        }
    }


    class strip {
        constructor() {
            this.pts = [];
            this.colos = [];
        };
    };

    function draw_Sharp_Joint(gl, pts, feather) {

        var insertCoor = {};

        var twoPointsArray = insertPoints(pts, linewidth, false);
        var res = insertPoints(twoPointsArray[0], featherWidth, false);
        var leftFeatherArray = res[0];
        res = insertPoints(twoPointsArray[1], featherWidth, false);
        var rightFeatherArray = res[1];


        insertCoor.left = twoPointsArray[0];
        insertCoor.right = twoPointsArray[1];
        insertCoor.leftFeather = leftFeatherArray;
        insertCoor.rightFeather = rightFeatherArray;

        // let Strip = new strip();
        let points = ptsToTriangles(insertCoor.left, insertCoor.right);
        let color = addColorToPts(points);
        // Strip.pts = ptsToTriangles(insertCoor.left, insertCoor.right);
        // Strip.color = addColorToPts(Strip.pts);

        console.log(points.length / 3);
        gl_draw_with_color(gl, points, color, 4);


        var leftStrip = addColortoFeatherVertex(insertCoor.leftFeather, insertCoor.left, shallowClr, deepClr);
        var rightStrip = addColortoFeatherVertex(insertCoor.rightFeather, insertCoor.right, shallowClr, deepClr);

        if (feather) {
            gl_draw_with_color(gl, leftStrip.triangleStrip, leftStrip.colorArr, 4);
            gl_draw_with_color(gl, rightStrip.triangleStrip, rightStrip.colorArr, 4);
        }

    }
}