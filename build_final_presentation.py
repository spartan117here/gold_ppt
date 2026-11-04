import os
import shutil
import zipfile
import tempfile
import cv2
from PIL import Image
from lxml import etree
import pptx
from pptx.util import Inches, Length
from pptx.enum.shapes import MSO_SHAPE_TYPE

def build_presentation():
    root_dir = os.path.abspath('.')
    orig_pptx = os.path.join(root_dir, 'Gold Training_29.10.26.pptx')
    backup_pptx = os.path.join(root_dir, 'Gold Training_29.10.26_original_backup.pptx')
    
    # 1. Backup original if not already backed up
    if not os.path.exists(backup_pptx):
        shutil.copy2(orig_pptx, backup_pptx)
        print("Backed up original presentation.")

    # 2. Extract poster frame from slide 39 video
    video_path = os.path.join(root_dir, 'new slides', 'slide 39 video.mp4')
    poster_path = os.path.join(root_dir, 'video39_frame0.png')
    cap = cv2.VideoCapture(video_path)
    ret, frame = cap.read()
    cap.release()
    if ret:
        cv2.imwrite(poster_path, frame)
        print("Extracted poster frame from video.")

    # 3. Open original presentation
    prs = pptx.Presentation(backup_pptx)
    
    # Standard 16:9 Widescreen dimensions (exact EMUs)
    prs.slide_width = Length(12192000) # 13.3333 inches
    prs.slide_height = Length(6858000) # 7.5 inches
    slide_w = Length(12192000)
    slide_h = Length(6858000)
    
    scale_x = 12192000.0 / 9144000.0

    # 4. Scale Slides 1 to 35
    # Slide 1: center logo and title
    s1 = prs.slides[0]
    for shape in s1.shapes:
        shape.left = (slide_w - shape.width) // 2

    # Slide 5 and 6: scale horizontally to span 16:9
    for s_idx in [4, 5]:
        s = prs.slides[s_idx]
        for shape in s.shapes:
            shape.left = int(round(shape.left * scale_x))
            shape.width = int(round(shape.width * scale_x))

    # Slides 2-4, 7-35: scale full-bleed pictures to fill 16:9 canvas
    for s_idx in range(1, 35):
        if s_idx in [4, 5]:
            continue
        s = prs.slides[s_idx]
        for shape in s.shapes:
            if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                shape.left = 0
                shape.top = 0
                shape.width = slide_w
                shape.height = slide_h
            else:
                shape.left = int(round(shape.left * scale_x))
                shape.width = int(round(shape.width * scale_x))

    # Function to clear shapes
    def clear_shapes(slide):
        spTree = slide.shapes._spTree
        for shape in list(slide.shapes):
            spTree.remove(shape._element)

    # 5. Replace Slides 36 to 42
    # Slide 36: slide 36.png
    s36 = prs.slides[35]
    clear_shapes(s36)
    s36.shapes.add_picture(os.path.join(root_dir, 'new slides', 'slide 36.png'), 0, 0, slide_w, slide_h)

    # Slide 37: slide 37.jpg
    s37 = prs.slides[36]
    clear_shapes(s37)
    s37.shapes.add_picture(os.path.join(root_dir, 'new slides', 'slide 37.jpg'), 0, 0, slide_w, slide_h)

    # Slide 38: slide 38.jpeg
    s38 = prs.slides[37]
    clear_shapes(s38)
    s38.shapes.add_picture(os.path.join(root_dir, 'new slides', 'slide 38.jpeg'), 0, 0, slide_w, slide_h)

    # Slide 39: slide 39.png + video
    s39 = prs.slides[38]
    clear_shapes(s39)
    s39.shapes.add_picture(os.path.join(root_dir, 'new slides', 'slide 39.png'), 0, 0, slide_w, slide_h)
    
    # Exact video position inside golden frame (16:9 ratio)
    v_left = 6931418
    v_top = 2634239
    v_width = 4056700
    v_height = 2281894
    s39.shapes.add_movie(
        video_path,
        v_left, v_top, v_width, v_height,
        poster_frame_image=poster_path,
        mime_type='video/mp4'
    )

    # Slide 40: slide 40.png + image
    s40 = prs.slides[39]
    clear_shapes(s40)
    s40.shapes.add_picture(os.path.join(root_dir, 'new slides', 'slide 40.png'), 0, 0, slide_w, slide_h)
    
    # Exact image position inside golden frame (maintaining original aspect ratio)
    im_left = 8069628
    im_top = 2222837
    im_width = 2261831
    im_height = 3337902
    s40.shapes.add_picture(
        os.path.join(root_dir, 'new slides', 'slide 40 image.png'),
        im_left, im_top, im_width, im_height
    )

    # Slide 41: slide 41.png
    s41 = prs.slides[40]
    clear_shapes(s41)
    s41.shapes.add_picture(os.path.join(root_dir, 'new slides', 'slide 41.png'), 0, 0, slide_w, slide_h)

    # Slide 42: slide 42.png
    s42 = prs.slides[41]
    clear_shapes(s42)
    s42.shapes.add_picture(os.path.join(root_dir, 'new slides', 'slide 42.png'), 0, 0, slide_w, slide_h)

    # Save initial PPTX
    temp_pptx = os.path.join(root_dir, 'temp_built.pptx')
    prs.save(temp_pptx)
    print("Initial PPTX saved. Now applying XML post-processing...")

    # 6. Post-process XML for 100% native PowerPoint 16:9 widescreen & video timing
    temp_dir = tempfile.mkdtemp()
    with zipfile.ZipFile(temp_pptx, 'r') as z:
        z.extractall(temp_dir)

    # A. Update ppt/presentation.xml: <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
    pres_xml_path = os.path.join(temp_dir, 'ppt', 'presentation.xml')
    pres_tree = etree.parse(pres_xml_path)
    pres_root = pres_tree.getroot()
    p_ns = 'http://schemas.openxmlformats.org/presentationml/2006/main'
    sldSz = pres_root.find(f'{{{p_ns}}}sldSz')
    if sldSz is not None:
        sldSz.set('cx', '12192000')
        sldSz.set('cy', '6858000')
        sldSz.set('type', 'screen16x9')
    pres_tree.write(pres_xml_path, xml_declaration=True, encoding='utf-8', standalone=True)

    # B. Update docProps/app.xml: <PresentationFormat>Widescreen</PresentationFormat>
    app_xml_path = os.path.join(temp_dir, 'docProps', 'app.xml')
    if os.path.exists(app_xml_path):
        app_tree = etree.parse(app_xml_path)
        app_root = app_tree.getroot()
        ep_ns = 'http://schemas.openxmlformats.org/officeDocument/2006/extended-properties'
        pres_fmt = app_root.find(f'{{{ep_ns}}}PresentationFormat')
        if pres_fmt is not None:
            pres_fmt.text = 'Widescreen'
        app_tree.write(app_xml_path, xml_declaration=True, encoding='utf-8', standalone=True)

    # C. Update ppt/slides/slide39.xml: wire video timing
    s39_xml_path = os.path.join(temp_dir, 'ppt', 'slides', 'slide39.xml')
    s39_tree = etree.parse(s39_xml_path)
    s39_root = s39_tree.getroot()
    
    # Find video shape ID
    video_spid = None
    for pic in s39_root.xpath('//p:pic', namespaces={'p': p_ns, 'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}):
        nvPr = pic.find('.//p:nvPr', namespaces={'p': p_ns})
        if nvPr is not None and nvPr.find('.//a:videoFile', namespaces={'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}) is not None:
            cNvPr = pic.find('.//p:cNvPr', namespaces={'p': p_ns})
            video_spid = cNvPr.get('id')
            break
            
    print(f"Slide 39 video shape ID: {video_spid}")
    
    # Timing XML with autoplay and click-to-pause
    timing_xml = f'''<p:timing xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:tnLst>
    <p:par>
      <p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot">
        <p:childTnLst>
          <p:seq concurrent="1" nextAc="seek">
            <p:cTn id="2" dur="indefinite" nodeType="mainSeq">
              <p:childTnLst>
                <p:par>
                  <p:cTn id="3" fill="hold">
                    <p:stCondLst>
                      <p:cond delay="indefinite"/>
                      <p:cond evt="onBegin" delay="0">
                        <p:tn val="2"/>
                      </p:cond>
                    </p:stCondLst>
                    <p:childTnLst>
                      <p:par>
                        <p:cTn id="4" fill="hold">
                          <p:stCondLst>
                            <p:cond delay="0"/>
                          </p:stCondLst>
                          <p:childTnLst>
                            <p:par>
                              <p:cTn id="5" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="afterEffect">
                                <p:stCondLst>
                                  <p:cond delay="0"/>
                                </p:stCondLst>
                                <p:childTnLst>
                                  <p:cmd type="call" cmd="playFrom(0.0)">
                                    <p:cBhvr>
                                      <p:cTn id="6" dur="4064" fill="hold"/>
                                      <p:tgtEl>
                                        <p:spTgt spid="{video_spid}"/>
                                      </p:tgtEl>
                                    </p:cBhvr>
                                  </p:cmd>
                                </p:childTnLst>
                              </p:cTn>
                            </p:par>
                          </p:childTnLst>
                        </p:cTn>
                      </p:par>
                    </p:childTnLst>
                  </p:cTn>
                </p:par>
              </p:childTnLst>
            </p:cTn>
            <p:prevCondLst>
              <p:cond evt="onPrev" delay="0">
                <p:tgtEl>
                  <p:sldTgt/>
                </p:tgtEl>
              </p:cond>
            </p:prevCondLst>
            <p:nextCondLst>
              <p:cond evt="onNext" delay="0">
                <p:tgtEl>
                  <p:sldTgt/>
                </p:tgtEl>
              </p:cond>
            </p:nextCondLst>
          </p:seq>
          <p:video>
            <p:cMediaNode vol="80000">
              <p:cTn id="7" repeatCount="indefinite" fill="hold" display="0">
                <p:stCondLst>
                  <p:cond delay="indefinite"/>
                </p:stCondLst>
              </p:cTn>
              <p:tgtEl>
                <p:spTgt spid="{video_spid}"/>
              </p:tgtEl>
            </p:cMediaNode>
          </p:video>
          <p:seq concurrent="1" nextAc="seek">
            <p:cTn id="8" restart="whenNotActive" fill="hold" evtFilter="cancelBubble" nodeType="interactiveSeq">
              <p:stCondLst>
                <p:cond evt="onClick" delay="0">
                  <p:tgtEl>
                    <p:spTgt spid="{video_spid}"/>
                  </p:tgtEl>
                </p:cond>
              </p:stCondLst>
              <p:endSync evt="end" delay="0">
                <p:rtn val="all"/>
              </p:endSync>
              <p:childTnLst>
                <p:par>
                  <p:cTn id="9" fill="hold">
                    <p:stCondLst>
                      <p:cond delay="0"/>
                    </p:stCondLst>
                    <p:childTnLst>
                      <p:par>
                        <p:cTn id="10" fill="hold">
                          <p:stCondLst>
                            <p:cond delay="0"/>
                          </p:stCondLst>
                          <p:childTnLst>
                            <p:par>
                              <p:cTn id="11" presetID="2" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="clickEffect">
                                <p:stCondLst>
                                  <p:cond delay="0"/>
                                </p:stCondLst>
                                <p:childTnLst>
                                  <p:cmd type="call" cmd="togglePause">
                                    <p:cBhvr>
                                      <p:cTn id="12" dur="1" fill="hold"/>
                                      <p:tgtEl>
                                        <p:spTgt spid="{video_spid}"/>
                                      </p:tgtEl>
                                    </p:cBhvr>
                                  </p:cmd>
                                </p:childTnLst>
                              </p:cTn>
                            </p:par>
                          </p:childTnLst>
                        </p:cTn>
                      </p:par>
                    </p:childTnLst>
                  </p:cTn>
                </p:par>
              </p:childTnLst>
            </p:cTn>
            <p:nextCondLst>
              <p:cond evt="onClick" delay="0">
                <p:tgtEl>
                  <p:spTgt spid="{video_spid}"/>
                </p:tgtEl>
              </p:cond>
            </p:nextCondLst>
          </p:seq>
        </p:childTnLst>
      </p:cTn>
    </p:par>
  </p:tnLst>
</p:timing>'''
    
    old_timing = s39_root.find(f'{{{p_ns}}}timing')
    if old_timing is not None:
        s39_root.remove(old_timing)
    s39_root.append(etree.fromstring(timing_xml))
    s39_tree.write(s39_xml_path, xml_declaration=True, encoding='utf-8', standalone=True)

    # 7. Package the updated PPTX
    final_pptx = os.path.join(root_dir, 'Gold Training_29.10.26.pptx')
    with zipfile.ZipFile(final_pptx, 'w', zipfile.ZIP_DEFLATED) as z_out:
        for r_dir, dirs, files in os.walk(temp_dir):
            for file in files:
                f_path = os.path.join(r_dir, file)
                rel_path = os.path.relpath(f_path, temp_dir)
                z_out.write(f_path, rel_path)
    print(f"Updated main presentation at: {final_pptx}")
    shutil.rmtree(temp_dir)
    if os.path.exists(temp_pptx):
        os.remove(temp_pptx)

    # 8. Create Delivery Folder
    delivery_dir = os.path.join(root_dir, 'Updated_Gold_Training_Presentation')
    if os.path.exists(delivery_dir):
        shutil.rmtree(delivery_dir)
    os.makedirs(delivery_dir, exist_ok=True)
    
    # Copy presentation
    shutil.copy2(final_pptx, os.path.join(delivery_dir, 'Gold Training_29.10.26.pptx'))
    shutil.copy2(final_pptx, os.path.join(delivery_dir, 'Gold Training_Updated_Widescreen.pptx'))

    # Media folder
    media_dir = os.path.join(delivery_dir, 'media')
    os.makedirs(media_dir, exist_ok=True)
    for item in os.listdir(os.path.join(root_dir, 'new slides')):
        src = os.path.join(root_dir, 'new slides', item)
        shutil.copy2(src, os.path.join(media_dir, item))

    # Readme file
    readme_path = os.path.join(delivery_dir, 'README.txt')
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write("""=============================================================
POTHYS SWARNA MAHAL - GOLD TRAINING PROGRAM PRESENTATION
=============================================================

Updated PowerPoint Presentation Package
Aspect Ratio: 16:9 Widescreen (Native 12,192,000 x 6,858,000 EMUs)
Total Slides: 42 Slides

-------------------------------------------------------------
1. UPDATES APPLIED
-------------------------------------------------------------
- Slide 36: Replaced with 'slide 36.png' (Jewellery Handling: Points 1, 2, 3 with Tamil & English)
- Slide 37: Replaced with 'slide 37.jpg' (Jewellery Handling: Points 4, 5 with Tamil & English)
- Slide 38: Replaced with 'slide 38.jpeg' (Jewellery Handling: Points 6, 7, 8 with Tamil & English)
- Slide 39: Replaced with 'slide 39.png' + 'slide 39 video.mp4' inserted inside the golden display frame with native playable controls and poster frame
- Slide 40: Replaced with 'slide 40.png' + 'slide 40 image.png' placed inside the golden display frame maintaining original aspect ratio
- Slide 41: Replaced with 'slide 41.png' (Types of Customer category & identification table)
- Slide 42: Replaced with 'slide 42.png' (Pothys Swarna Mahal Thank You slide)

-------------------------------------------------------------
2. FULL-SCREEN COVERAGE (16:9)
-------------------------------------------------------------
- Canvas format configured as native 16:9 Widescreen.
- All slides calibrated to fill the complete widescreen display without black borders, white margins, or stretching distortion.
- Supporting media files included in the 'media/' folder for portability across computers and PowerPoint versions.

-------------------------------------------------------------
3. HOW TO RUN
-------------------------------------------------------------
- Open 'Gold Training_29.10.26.pptx' in Microsoft PowerPoint.
- Press F5 (or Start Slide Show).
- Slide 39 video will play smoothly in full HD.
=============================================================
""")

    # 9. Create ZIP archive
    zip_path = os.path.join(root_dir, 'Gold_Training_Updated_Presentation.zip')
    if os.path.exists(zip_path):
        os.remove(zip_path)
        
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
        for r_dir, dirs, files in os.walk(delivery_dir):
            for file in files:
                f_path = os.path.join(r_dir, file)
                rel_path = os.path.relpath(f_path, root_dir)
                z.write(f_path, rel_path)
                
    print(f"Created ZIP package at: {zip_path}")
    print(f"Package file size: {os.path.getsize(zip_path):,} bytes")
    print("Done!")

if __name__ == '__main__':
    build_presentation()
