(function() {
  var animate, camDist, camPitch, camProj, camRot, camView, canvas, container, controls, counter, cubeGeom, displayShader, draw, fullscreenImg, gl, hover, lightProj, lightRot, lightView, model, mousemove, mouseup, name, offset, planeGeom;

  name = 'no-shadow';

  document.write("<div id=\"" + name + "\" class=\"example\"></div>");

  container = $('#' + name);

  canvas = $('<canvas></canvas>').appendTo(container)[0];

  try {
    gl = new WebGLFramework(canvas).depthTest();
  } catch (error) {
    container.empty();
    $('<div class="error"></div>').text(error).appendTo(container);
    $('<div class="error-info"></div>').text('(screenshot instead)').appendTo(container);
    $("<img src=\"" + name + ".png\">").appendTo(container);
    return;
  }

  fullscreenImg = $('<img class="toggle-fullscreen" src="fullscreen.png">').appendTo(container).click(function() {
    return gl.toggleFullscreen(container[0]);
  });

  gl.onFullscreenChange(function(isFullscreen) {
    if (isFullscreen) {
      container.addClass('fullscreen');
      return fullscreenImg.attr('src', 'exit-fullscreen.png');
    } else {
      container.removeClass('fullscreen');
      return fullscreenImg.attr('src', 'fullscreen.png');
    }
  });

  hover = false;

  container.hover((function() {
    return hover = true;
  }), (function() {
    return hover = false;
  }));

  animate = true;

  controls = $('<div class="controls"></div>').appendTo(container);

  $('<label>Animate</label>').appendTo(controls);

  $('<input type="checkbox" checked="checked"></input>').appendTo(controls).change(function() {
    return animate = this.checked;
  });

  cubeGeom = gl.drawable(meshes.cube);

  planeGeom = gl.drawable(meshes.plane(50));

  displayShader = gl.shader({
    common: '#line 49 no-shadow.coffee\nvarying vec3 vWorldNormal; varying vec4 vWorldPosition;\nuniform mat4 camProj, camView;\nuniform mat4 lightProj, lightView; uniform mat3 lightRot;\nuniform mat4 model;',
    vertex: '#line 55 no-shadow.coffee\nattribute vec3 position, normal;\n\nvoid main(){\n    vWorldNormal = normal;\n    vWorldPosition = model * vec4(position, 1.0);\n    gl_Position = camProj * camView * vWorldPosition;\n}',
    fragment: '#line 64 no-shadow.coffee\nfloat attenuation(vec3 dir){\n    float dist = length(dir);\n    float radiance = 1.0/(1.0+pow(dist/10.0, 2.0));\n    return clamp(radiance*10.0, 0.0, 1.0);\n}\n\nfloat influence(vec3 normal, float coneAngle){\n    float minConeAngle = ((360.0-coneAngle-10.0)/360.0)*PI;\n    float maxConeAngle = ((360.0-coneAngle)/360.0)*PI;\n    return smoothstep(minConeAngle, maxConeAngle, acos(normal.z));\n}\n\nfloat lambert(vec3 surfaceNormal, vec3 lightDirNormal){\n    return max(0.0, dot(surfaceNormal, lightDirNormal));\n}\n\nvec3 skyLight(vec3 normal){\n    return vec3(smoothstep(0.0, PI, PI-acos(normal.y)))*0.4;\n}\n\nvec3 gamma(vec3 color){\n    return pow(color, vec3(2.2));\n}\n\nvoid main(){\n    vec3 worldNormal = normalize(vWorldNormal);\n\n    vec3 camPos = (camView * vWorldPosition).xyz;\n    vec3 lightPos = (lightView * vWorldPosition).xyz;\n    vec3 lightPosNormal = normalize(lightPos);\n    vec3 lightSurfaceNormal = lightRot * worldNormal;\n\n    vec3 excident = (\n        skyLight(worldNormal) +\n        lambert(lightSurfaceNormal, -lightPosNormal) *\n        influence(lightPosNormal, 55.0) *\n        attenuation(lightPos)\n    );\n    gl_FragColor = vec4(gamma(excident), 1.0);\n}'
  });

  camProj = gl.mat4();

  camView = gl.mat4();

  lightProj = gl.mat4().perspective({
    fov: 60
  }, 1, {
    near: 0.01,
    far: 100
  });

  lightView = gl.mat4().trans(0, 0, -6).rotatex(30).rotatey(110);

  lightRot = gl.mat3().fromMat4Rot(lightView);

  model = gl.mat4();

  counter = -Math.PI * 0.5;

  offset = 0;

  camDist = 10;

  camRot = 55;

  camPitch = 41;

  mouseup = function() {
    return $(document).unbind('mousemove', mousemove).unbind('mouseup', mouseup);
  };

  mousemove = function(_arg) {
    var originalEvent, x, y, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    originalEvent = _arg.originalEvent;
    x = (_ref = (_ref1 = (_ref2 = originalEvent.movementX) != null ? _ref2 : originalEvent.webkitMovementX) != null ? _ref1 : originalEvent.mozMovementX) != null ? _ref : originalEvent.oMovementX;
    y = (_ref3 = (_ref4 = (_ref5 = originalEvent.movementY) != null ? _ref5 : originalEvent.webkitMovementY) != null ? _ref4 : originalEvent.mozMovementY) != null ? _ref3 : originalEvent.oMovementY;
    camRot += x;
    camPitch += y;
    if (camPitch > 85) {
      return camPitch = 85;
    } else if (camPitch < 1) {
      return camPitch = 1;
    }
  };

  $(canvas).bind('mousedown', function() {
    $(document).bind('mousemove', mousemove).bind('mouseup', mouseup);
    return false;
  }).bind('mousewheel', function(_arg) {
    var originalEvent;
    originalEvent = _arg.originalEvent;
    camDist -= originalEvent.wheelDeltaY / 250;
    return false;
  }).bind('DOMMouseScroll', function(_arg) {
    var originalEvent;
    originalEvent = _arg.originalEvent;
    camDist += originalEvent.detail / 5;
    return false;
  });

  draw = function() {
    gl.adjustSize().viewport().cullFace('back').clearColor(0, 0, 0, 0).clearDepth(1);
    camProj.perspective({
      fov: 60,
      aspect: gl.aspect,
      near: 0.01,
      far: 100
    });
    camView.ident().trans(0, -1, -camDist).rotatex(camPitch).rotatey(camRot);
    return displayShader.use().mat4('camProj', camProj).mat4('camView', camView).mat4('lightView', lightView).mat4('lightProj', lightProj).mat3('lightRot', lightRot).mat4('model', model.ident().trans(0, 0, 0)).draw(planeGeom).mat4('model', model.ident().trans(0, 1 + offset, 0)).draw(cubeGeom).mat4('model', model.ident().trans(5, 1, -1)).draw(cubeGeom);
  };

  draw();

  gl.animationInterval(function() {
    if (hover) {
      if (animate) {
        offset = 1 + Math.sin(counter);
        counter += 1 / 30;
      } else {
        offset = 0;
      }
      return draw();
    }
  });

}).call(this);
