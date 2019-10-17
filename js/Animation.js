/*

make a animation of smooth line 

*/

//平滑折线段
function addPoints(vectors){
    let outputArr = [];
    outputArr.push(vectors[0]);
    for(var i =0; i<vectors.length-1;i++){
        x1 = vectors[i].x;
        y1 = vectors[i].y;
        z1 = vectors[i].z;
        x2 = vectors[i+1].x;
        y2= vectors[i+1].y;
        z2 = vectors[i+1].z;

        let Q = new THREE.Vector3(0.75*x1 +0.25*x2, 0.75*y1+0.25*y2);
        let R = new THREE.Vector3(0.25*x1 +0.75*x2, 0.25*y1+0.75*y2);

        outputArr.push(Q);
        outputArr.push(R);
    }
    outputArr.push(vectors[i]);
    return outputArr;
}

//iterations:迭代的次数
function smoothLine(vectors, iterations){
    let outputArr =[];
    let input = vectors.slice(0);
    let tmp = [];
    for(let i = 0;i<iterations;i++){
        tmp = addPoints(input);
        input = tmp.slice(0);
    }
    outputArr = tmp;
    return outputArr;
}

function draw_animation(vectors,width,color){
    let result_pts = smoothLine(vectors,3);
    let trianglesWithClr = {};
    let colorArr = [];
    let w = width*transform();
    let insert_Points = insertPoints(result_pts,w,false);
    trianglesWithClr.triangleStrip = ptsToTriangleStrip(insert_Points[0],insert_Points[1]);
    for(let i = 0;i<trianglesWithClr.triangleStrip.length;i++){
        colorArr.push(color);
    }
    trianglesWithClr.colorArr = colorArr;
    triangleStrip = vec2Tovec3(trianglesWithClr.triangleStrip);

    let gl = getWebglEle();
    gl.clearColor(0.9, 0.9, 0.9, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawlineSequence(gl,triangleStrip,trianglesWithClr.colorArr,5);
}