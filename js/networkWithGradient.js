
//河网的渐变绘制

//采用角平分线渐变的方式一条河流进行渐变，渐变的方法采用简单的沿线方向的距离渐变
function getWid_narrow_wide_by_level(level){
    let width = {
        1:{widest:3,narrowest:1},
        2:{widest:1,narrowest:0.5},
        3:{widest:0.5,narrowest:0.3},
        4:{widest:0.3,narrowest:0.2},
        5:{widest:0.2,narrowest:0.2},
        6:{widest:0.2,narrowest:0.2}
    }
    return width[level];
}

function getEveryWholeLine_coors(origin_data,color){
    let boundary = getMapSize(getlines(origin_data));
    let ratio = getRatio(boundary);

    let line_level = allLines(origin_data);
    let lines =  getPoints(line_level);
    let triangles = [],colorArray = [];

    let gl = getWebglEle();
    gl.clearColor(0.95, 0.95, 0.95, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for(let i = 0;i<lines.coors.length;i++){

        let level = lines.level[i];
        let width = getWid_narrow_wide_by_level(level);
        let triangleStrip = gradientByRank(lines.coors[i],ratio,true,width.widest,width.narrowest,color);

        triangles = triangleStrip.triStrip;
        colorArray = triangleStrip.colorArr;
        triangles = convertCor(triangles,boundary);
        triangles = pointToVec(triangles);
        let coors = vec2Tovec3(triangles)  ;    
        drawlineSequence(gl,coors,colorArray,5);
    }

}


function gradientByRank(coors_vec, ratio, isGradient, widest_wid, narrowest_wid, color  ){
    widest_wid = widest_wid+0.8;
    narrowest_wid = narrowest_wid+0.8;

    let triangleStrip = {};
    let pt_left = [];
    let pt_right = [];
    // let width = narrowest_wid*transform(); 
    let width = narrowest_wid*ratio;


    //源头处的插值点
    let v1 = new THREE.Vector2();
    let v2 = new THREE.Vector2();


    v1.subVectors(coors_vec[1],coors_vec[0]);
    v1.normalize();
    v2 = getNormal(v1);

    let pt1 = getXY(v2,coors_vec[0],width);
    let pt2 = getXY(v2.negate(), coors_vec[0],width);

    pt_left.push(pt1);
    pt_right.push(pt2);

    let len = coors_vec.length;
    for(let i = 1;i<len-1;i++){
        if(isGradient && widest_wid!=undefined&&narrowest_wid!=undefined&&color!=undefined){
            width = ((widest_wid - narrowest_wid)*i/len + narrowest_wid)*ratio;
            // console.log(width);
        }
        v1.subVectors(coors_vec[i],coors_vec[i-1]);//last to current 方向向量
        v1.normalize();
        v2.subVectors(coors_vec[i+1],coors_vec[i]);
        v2.normalize();

        let vec3 = new THREE.Vector2();
        vec3.addVectors(v1, v2);
        vec3.normalize();

        let normal = new THREE.Vector2(-v1.y,v1.x);
        let miter = new THREE.Vector2(-vec3.y,vec3.x);

        let angle_len = width/(normal.dot(miter));
    
        let point1 = getXY(miter,coors_vec[i],angle_len);
        let point2 = getXY(miter.negate(),coors_vec[i],angle_len);
        pt_left.push(point1);
        pt_right.push(point2);
    }
    // console.log(width);
    //结尾处的插值点
    v1.subVectors(coors_vec[len-1],coors_vec[len-2]);
    v1.normalize();
    v2 = getNormal(v1);

    pt1 = getXY(v2,coors_vec[len-1],width);
    pt2 = getXY(v2.negate(), coors_vec[len-1],width);

    pt_left.push(pt1);
    pt_right.push(pt2);

    // console.log(pt_left,pt_right);
    let triStrip = ptsToTriangleStrip(pt_left, pt_right);
    let colorArr = [];
    for (let i = 0; i<triStrip.length;i++)
    {
        colorArr.push(color);
    }
    triangleStrip.triStrip = triStrip;
    triangleStrip.colorArr = colorArr;

    // console.log(triangleStrip);
    return triangleStrip;
}

function test_gradient(points){
    let gl = getWebglEle();
    gl.clearColor(0.9, 0.9, 0.9, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let pts = pointToVec(points);
    pts = splitePolyline(pts,0.1);
    let triangleStrip = gradientByRank(pts,true,50,30,new Color(0,0,1,1));
    let coors = vec2Tovec3(triangleStrip.triStrip)  ;
    drawlineSequence(gl,coors,triangleStrip.colorArr,5);
}