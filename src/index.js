import paper from 'paper';

function lerp(v0, v1, t) {
    return (1 - t) * v0 + t * v1;
}

const handsfree = new Handsfree({
    maxPoses: 1,
    hideCursor: true,
    // debug: true,
});
handsfree.start();

window.onload = () => {

    let canvas = document.getElementById('myCanvas');
    paper.setup(canvas);

    const lipsOuterTracked = new Array(12);
    lipsOuterTracked.fill(new paper.Point(0, 0));

    const lipsInnerTracked = new Array(8);
    lipsInnerTracked.fill(new paper.Point(0, 0));

    const lipsOuterDefault = new Array(12);
    for (let i = 0; i < 12; i++)
    {
        let angle = 2 * Math.PI * i / 12;
        lipsOuterDefault[i] = new paper.Point(
            Math.cos(angle),
            -Math.sin(angle)
        );
    }

    const lipsInnerDefault = new Array(8);
    for (let i = 0; i < 8; i++)
    {
        let angle = 2 * Math.PI * i / 8;
        lipsInnerDefault[i] = new paper.Point(
            Math.cos(angle),
            0
        );
    }
    
    const lipsOuter = new Array(12);
    const lipsInner = new Array(8);
    
    const lipsOuterPath = new paper.Path();
    lipsOuterPath.closed = true;
    const lipsInnerPath = new paper.Path();
    lipsInnerPath.closed = true;
    lipsInnerPath.style = {
        fillColor: new paper.Color(0, 0, 0),
        strokeJoin: 'bevel',
    };
    let lipsLerp = 0;
    const lerpSpeed = 6.0;

    paper.view.onFrame = (event) => {

        if (handsfree.pose.length > 0 && handsfree.pose[0].face && handsfree.pose[0].face.state === 'state_face_tracking')
        {
            let points = handsfree.pose[0].face.points;
            let mouthCenter = new paper.Point(
                (points[48].x + points[54].x) * 0.5,
                (points[48].y + points[54].y) * 0.5,
            );
            let eyeDist = new paper.Point(
                points[39].x - points[42].x,
                points[39].y - points[42].y,
            );
            eyeDist.x *= eyeDist.x;
            eyeDist.y *= eyeDist.y;
            let eyeScale = Math.sqrt(eyeDist.x + eyeDist.y);
            let screenWidth = 0.2 * paper.view.size.width;
            let scale = screenWidth / eyeScale;

            let getPos = (point) => {
                let pos = new paper.Point(point.x, point.y);
                pos = pos.subtract(mouthCenter);
                pos.x *= -1;
                pos = pos.multiply(scale);
                return pos;
            };

            for (let i = 0; i < 12; i++)
            {
                lipsOuterTracked[i] = getPos(points[i + 48]);
            }

            for (let i = 0; i < 8; i++)
            {
                lipsInnerTracked[i] = getPos(points[i + 60]);
            }

            lipsLerp = lerp(lipsLerp, 1, lerpSpeed * event.delta);
        }
        else
        {
            lipsLerp = lerp(lipsLerp, 0, lerpSpeed * event.delta);
        }

        let circleSize = 0.01 * paper.view.size.width;
        for (let i = 0; i < 12; i++)
        {
            lipsOuter[i] = new paper.Point(
                lerp(lipsOuterDefault[i].x * circleSize, lipsOuterTracked[i].x, lipsLerp),
                lerp(lipsOuterDefault[i].y * circleSize, lipsOuterTracked[i].y, lipsLerp)
            ).add(paper.view.center);
        }
        for (let i = 0; i < 8; i++)
        {
            lipsInner[i] = new paper.Point(
                lerp(lipsInnerDefault[i].x * circleSize * 0.5, lipsInnerTracked[i].x, lipsLerp),
                lerp(lipsInnerDefault[i].y * circleSize * 0.5, lipsInnerTracked[i].y, lipsLerp)
            ).add(paper.view.center);
        }

        
        lipsOuterPath.segments = lipsOuter;
        lipsOuterPath.smooth({ from: 1, to: 6 });
        lipsOuterPath.smooth({ from: 7, to: 0 });
        
        lipsInnerPath.segments = lipsInner;
        lipsInnerPath.style.strokeWidth = 0.008 * paper.view.size.width;

        let colorGray = lerp(0.3, 1, lipsLerp);
        let color = new paper.Color(colorGray, colorGray, colorGray);
        lipsOuterPath.style.fillColor = color;
        lipsInnerPath.style.strokeColor = color;
    }

    paper.view.draw();
}

