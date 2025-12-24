import cv2
from ultralytics import solutions

points = []

def mouse_callback(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        print(f"Clicked at: ({x}, {y})")
        points.append((x, y))

def count_objects_in_region(video_path, output_video_path, model_path):
    """Count objects in a specific region within a video."""
    cap = cv2.VideoCapture(video_path)
    assert cap.isOpened(), "Error reading video file"
    w, h, fps = (int(cap.get(x)) for x in (cv2.CAP_PROP_FRAME_WIDTH, cv2.CAP_PROP_FRAME_HEIGHT, cv2.CAP_PROP_FPS))
    video_writer = cv2.VideoWriter(output_video_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

    region_points = [(318, 30), (412, 123), (529, 106), (425, 11)]
    counter = solutions.ObjectCounter(show=True, region=region_points, model=model_path)

    while cap.isOpened():
        success, im0 = cap.read()
        if not success:
            print("Video frame is empty or processing is complete.")
            break
    
        for p in points:
            cv2.circle(im0, p, 5, (0, 0, 255), -1)

        cv2.imshow("Click to get coordinates", im0)
        cv2.setMouseCallback("Click to get coordinates", mouse_callback)

        results = counter(im0)
        video_writer.write(results.plot_im)

        # 👇 ADD THIS
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("Interrupted by user (q pressed)")
            break

count_objects_in_region("sample/src/cars.mp4", "sample/output/output_video.avi", "python/dataset/yolo11n.pt")
