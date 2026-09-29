import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DashboardLayout } from "../components/Layout";

import {
  Card,
  Input,
  Textarea,
  Alert,
} from "../components/UI";

import {
  Upload,
  FileText,
  Music,
  Video,
  Link as LinkIcon,
  CheckCircle,
  ArrowRight,
  X,
  Loader2,
  Sparkles,
  Brain,
  FileCheck,
} from "lucide-react";

import { cn } from "../utils/helpers";

import lectureService from "../services/lectureService";

/*
|--------------------------------------------------------------------------
| UPLOAD TYPES
|--------------------------------------------------------------------------
*/

const uploadTypes = [
  {
    id: "pdf",
    name: "PDF",
    icon: FileText,
    description: "PDF lecture documents",
    accept: ".pdf",
  },
  {
    id: "ppt",
    name: "PowerPoint",
    icon: FileText,
    description: "PPT and PPTX files",
    accept: ".ppt,.pptx",
  },
  {
    id: "doc",
    name: "Word",
    icon: FileText,
    description: "DOC and DOCX files",
    accept: ".doc,.docx",
  },
  {
    id: "audio",
    name: "Audio",
    icon: Music,
    description: "MP3, WAV, M4A, AAC, FLAC, OGG",
    accept: ".mp3,.wav,.m4a,.aac,.flac,.ogg",
  },
  {
    id: "video",
    name: "Video",
    icon: Video,
    description: "MP4, WEBM, MKV, AVI, MOV",
    accept: ".mp4,.webm,.mkv,.avi,.mov",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: LinkIcon,
    description: "YouTube lecture URL",
    accept: null,
  },
];

/*
|--------------------------------------------------------------------------
| PROCESSING STAGES
|--------------------------------------------------------------------------
*/

const processingStages = [
  {
    label: "Uploading",
    description: "Sending your lecture securely",
    icon: "📤",
  },
  {
    label: "Extracting",
    description: "Extracting lecture content",
    icon: "📄",
  },
  {
    label: "Transcribing",
    description: "Converting speech to text",
    icon: "🎙️",
  },
  {
    label: "Cleaning",
    description: "Cleaning and normalizing content",
    icon: "🧹",
  },
  {
    label: "NLP Analysis",
    description: "Understanding topics and concepts",
    icon: "🧠",
  },
  {
    label: "Embeddings",
    description: "Preparing content for intelligent search",
    icon: "✨",
  },
  {
    label: "Ready",
    description: "Your AI Professor is ready",
    icon: "✅",
  },
];

/*
|--------------------------------------------------------------------------
| MAIN PAGE
|--------------------------------------------------------------------------
*/

export default function UploadLecturePage() {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [selectedType, setSelectedType] = useState("pdf");

  const [lectureData, setLectureData] = useState({
    title: "",
    subject: "",
    topic: "",
    description: "",
    fileUrl: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const [uploading, setUploading] = useState(false);

  const [currentStage, setCurrentStage] = useState(0);

  const [uploadComplete, setUploadComplete] = useState(false);

  const [lectureResult, setLectureResult] = useState(null);

  const [serverError, setServerError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | CHANGE TYPE
  |--------------------------------------------------------------------------
  */

  const handleTypeChange = (type) => {
    if (uploading) return;

    console.log("Upload type changed:", type);

    setSelectedType(type);
    setSelectedFile(null);
    setServerError("");

    setLectureData((prev) => ({
      ...prev,
      fileUrl: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILE SELECT
  |--------------------------------------------------------------------------
  */

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    console.log("File selected:", file);

    setSelectedFile(file);
    setServerError("");

    if (!lectureData.title) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ");

      setLectureData((prev) => ({
        ...prev,
        title: cleanName,
      }));
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DRAG & DROP
  |--------------------------------------------------------------------------
  */

  const handleDrop = (event) => {
    event.preventDefault();

    if (uploading) return;

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    console.log("File dropped:", file);

    setSelectedFile(file);
    setServerError("");

    if (!lectureData.title) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ");

      setLectureData((prev) => ({
        ...prev,
        title: cleanName,
      }));
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REMOVE FILE
  |--------------------------------------------------------------------------
  */

  const removeFile = () => {
    console.log("Removing selected file");

    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    if (!lectureData.title.trim()) {
      return "Please enter a lecture title.";
    }

    if (!lectureData.subject.trim()) {
      return "Please enter the subject.";
    }

    if (selectedType === "youtube") {
      if (!lectureData.fileUrl.trim()) {
        return "Please enter a YouTube URL.";
      }

      const url = lectureData.fileUrl.trim();

      if (
        !url.includes("youtube.com") &&
        !url.includes("youtu.be")
      ) {
        return "Please enter a valid YouTube URL.";
      }
    } else {
      if (!selectedFile) {
        return "Please select a lecture file.";
      }
    }

    return null;
  };

  /*
  |--------------------------------------------------------------------------
  | EXTRACT LECTURE ID
  |--------------------------------------------------------------------------
  */

  const extractLectureId = (result) => {
    if (!result) return null;

    return (
      result?.lecture_id ||
      result?.id ||
      result?.lecture?.lecture_id ||
      result?.lecture?.id ||
      result?.data?.lecture_id ||
      result?.data?.id ||
      result?.result?.lecture_id ||
      result?.result?.id ||
      result?.lecture_data?.lecture_id ||
      result?.lecture_data?.id ||
      null
    );
  };

  /*
  |--------------------------------------------------------------------------
  | HANDLE UPLOAD
  |--------------------------------------------------------------------------
  */

  const handleUpload = async () => {
    console.log("========================================");
    console.log("PREPARE FOR LEARNING CLICKED");
    console.log("Selected type:", selectedType);
    console.log("Selected file:", selectedFile);
    console.log("Lecture data:", lectureData);
    console.log("========================================");

    setServerError("");

    const validationError = validateForm();

    if (validationError) {
      console.warn("Validation failed:", validationError);
      setServerError(validationError);
      return;
    }

    setUploading(true);
    setUploadComplete(false);
    setLectureResult(null);
    setCurrentStage(0);

    try {
      let result = null;

      if (selectedType === "youtube") {
        console.log("Starting YouTube upload...");

        result = await lectureService.uploadYoutubeLecture({
          youtubeUrl: lectureData.fileUrl.trim(),
          title: lectureData.title.trim(),
          subject: lectureData.subject.trim(),
          topic: lectureData.topic.trim(),
          description: lectureData.description.trim(),
        });
      } else {
        console.log("Starting file upload...");

        result = await lectureService.uploadLecture({
          file: selectedFile,
          title: lectureData.title.trim(),
          subject: lectureData.subject.trim(),
          topic: lectureData.topic.trim(),
          description: lectureData.description.trim(),
        });
      }

      console.log("========================================");
      console.log("BACKEND RESULT:");
      console.log(result);
      console.log("========================================");

      if (!result?.success) {
        console.error(
          "Lecture processing failed:",
          result?.error
        );

        setServerError(
          result?.error ||
            "Lecture processing failed."
        );

        return;
      }

      setCurrentStage(1);
      await wait(300);

      setCurrentStage(2);
      await wait(300);

      setCurrentStage(3);
      await wait(300);

      setCurrentStage(4);
      await wait(300);

      setCurrentStage(5);
      await wait(300);

      setCurrentStage(6);

      const backendData = result.data;

      console.log(
        "Processed lecture data:",
        backendData
      );

      setLectureResult(backendData);

      const lectureId =
        extractLectureId(backendData);

      console.log(
        "Extracted lecture ID:",
        lectureId
      );

      if (!lectureId) {
        console.error(
          "Backend did not return a lecture ID.",
          backendData
        );

        setServerError(
          "Lecture was processed, but the backend did not return a lecture ID."
        );

        setUploadComplete(true);

        return;
      }

      localStorage.setItem(
        "current_lecture_id",
        String(lectureId)
      );

      localStorage.setItem(
        "current_lecture",
        JSON.stringify(backendData)
      );

      console.log(
        "Saved current lecture:",
        lectureId
      );

      setUploadComplete(true);
    } catch (error) {
      console.error(
        "========================================"
      );

      console.error(
        "LECTURE UPLOAD ERROR:"
      );

      console.error(error);

      console.error(
        "========================================"
      );

      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to process the lecture.";

      setServerError(
        typeof message === "string"
          ? message
          : JSON.stringify(message)
      );
    } finally {
      setUploading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | START LEARNING
  |--------------------------------------------------------------------------
  */

  const handleStartLearning = () => {
    console.log("========================================");
    console.log("START LEARNING CLICKED");
    console.log("Lecture result:", lectureResult);
    console.log("========================================");

    const lectureId =
      extractLectureId(lectureResult);

    if (!lectureId) {
      console.error(
        "Cannot start learning. Lecture ID missing.",
        lectureResult
      );

      setServerError(
        "Lecture ID is missing. Please process the lecture again."
      );

      return;
    }

    localStorage.setItem(
      "current_lecture_id",
      String(lectureId)
    );

    localStorage.setItem(
      "current_lecture",
      JSON.stringify(lectureResult)
    );

    navigate(
      `/ai-professor/${lectureId}`,
      {
        state: {
          lectureId,
          lecture: lectureResult,
        },
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | UPLOAD ANOTHER
  |--------------------------------------------------------------------------
  */

  const handleUploadAnother = () => {
    setSelectedType("pdf");
    setSelectedFile(null);
    setUploadComplete(false);
    setUploading(false);
    setCurrentStage(0);
    setLectureResult(null);
    setServerError("");

    setLectureData({
      title: "",
      subject: "",
      topic: "",
      description: "",
      fileUrl: "",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CURRENT TYPE
  |--------------------------------------------------------------------------
  */

  const currentUploadType =
    uploadTypes.find(
      (type) => type.id === selectedType
    );

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>

      <div
        className="
          min-h-full
          bg-[#f7f3ea]
          dark:bg-gray-950
          transition-colors
          duration-300
        "
      >

        <div
          className="
            max-w-7xl
            mx-auto
            px-4
            sm:px-6
            lg:px-8
            py-8
          "
        >

          {/* HEADER */}

          <div className="mb-8">

            <div className="flex items-center gap-2 mb-3">

              <div
                className="
                  w-8
                  h-8
                  rounded-lg
                  bg-[#e6ecdf]
                  dark:bg-gray-800
                  flex
                  items-center
                  justify-center
                "
              >
                <Sparkles
                  size={17}
                  className="
                    text-[#6f8061]
                    dark:text-[#aeb8a1]
                  "
                />
              </div>

              <span
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-[#c98262]
                  dark:text-[#e2a082]
                "
              >
                Start Learning
              </span>

            </div>

            <h1
              className="
                font-display
                text-4xl
                md:text-5xl
                text-[#3e4038]
                dark:text-gray-100
              "
            >
              Start your learning journey.
            </h1>

            <p
              className="
                mt-3
                max-w-2xl
                text-[#7d7d72]
                dark:text-gray-400
                text-base
                md:text-lg
              "
            >
              Upload your lecture material and let
              your AI Professor turn it into a
              personalized learning experience.
            </p>

          </div>

          {/* ERROR */}

          {serverError && (
            <div className="mb-6">
              <Alert
                variant="error"
                message={serverError}
                onClose={() =>
                  setServerError("")
                }
              />
            </div>
          )}

          {/* SUCCESS */}

          {uploadComplete ? (
            <SuccessView
              lectureResult={lectureResult}
              onStartLearning={
                handleStartLearning
              }
              onUploadAnother={
                handleUploadAnother
              }
            />
          ) : uploading ? (
            <ProcessingView
              currentStage={currentStage}
            />
          ) : (

            <div
              className="
                grid
                lg:grid-cols-[1fr_340px]
                gap-6
              "
            >

              {/* MAIN FORM */}

              <Card
                className="
                  p-6
                  md:p-8
                  bg-[#fffdf8]
                  dark:bg-gray-900
                  border-[#e4ded2]
                  dark:border-gray-800
                  shadow-sm
                  dark:shadow-none
                "
              >

                <div className="mb-7">

                  <h2
                    className="
                      font-display
                      text-2xl
                      text-[#3e4038]
                      dark:text-gray-100
                    "
                  >
                    Your lecture
                  </h2>

                  <p
                    className="
                      text-sm
                      text-[#85877d]
                      dark:text-gray-400
                      mt-1
                    "
                  >
                    Tell us a little about what
                    you want to learn.
                  </p>

                </div>

                <div className="space-y-5">

                  <Input
                    label="Lecture title *"
                    placeholder="e.g. Binary Search Fundamentals"
                    value={lectureData.title}
                    onChange={(e) =>
                      setLectureData((prev) => ({
                        ...prev,
                        title:
                          e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Subject *"
                    placeholder="e.g. Data Structures"
                    value={lectureData.subject}
                    onChange={(e) =>
                      setLectureData((prev) => ({
                        ...prev,
                        subject:
                          e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Topic"
                    placeholder="e.g. Searching Algorithms"
                    value={lectureData.topic}
                    onChange={(e) =>
                      setLectureData((prev) => ({
                        ...prev,
                        topic:
                          e.target.value,
                      }))
                    }
                  />

                  <Textarea
                    label="Description"
                    placeholder="Add any notes about this lecture..."
                    rows={4}
                    value={
                      lectureData.description
                    }
                    onChange={(e) =>
                      setLectureData((prev) => ({
                        ...prev,
                        description:
                          e.target.value,
                      }))
                    }
                  />

                  {/* YOUTUBE */}

                  {selectedType ===
                  "youtube" ? (

                    <div>

                      <Input
                        label="YouTube URL *"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={
                          lectureData.fileUrl
                        }
                        onChange={(e) =>
                          setLectureData(
                            (prev) => ({
                              ...prev,
                              fileUrl:
                                e.target.value,
                            })
                          )
                        }
                      />

                      <div
                        className="
                          mt-3
                          p-4
                          rounded-xl
                          bg-[#f3e8df]
                          dark:bg-orange-950/30
                          border
                          border-[#ead7ca]
                          dark:border-orange-900/50
                        "
                      >

                        <div className="flex gap-3">

                          <LinkIcon
                            size={20}
                            className="
                              text-[#c98262]
                              dark:text-orange-300
                              mt-0.5
                            "
                          />

                          <div>

                            <p
                              className="
                                text-sm
                                font-semibold
                                text-[#4d5047]
                                dark:text-gray-200
                              "
                            >
                              YouTube lecture
                            </p>

                            <p
                              className="
                                text-xs
                                text-[#85877d]
                                dark:text-gray-400
                                mt-1
                              "
                            >
                              We'll download the
                              lecture audio, transcribe
                              it, and prepare it for
                              your AI Professor.
                            </p>

                          </div>

                        </div>

                      </div>

                    </div>

                  ) : (

                    /* FILE */

                    <div>

                      <label
                        className="
                          block
                          text-sm
                          font-medium
                          text-[#4d5047]
                          dark:text-gray-200
                          mb-2
                        "
                      >
                        Lecture file *
                      </label>

                      {!selectedFile ? (

                        <div
                          onDragOver={(e) =>
                            e.preventDefault()
                          }
                          onDrop={handleDrop}
                          onClick={() =>
                            fileInputRef.current?.click()
                          }
                          className="
                            border-2
                            border-dashed
                            border-[#d8d1c4]
                            dark:border-gray-700
                            rounded-2xl
                            p-10
                            text-center
                            cursor-pointer
                            bg-[#faf7f0]
                            dark:bg-gray-800
                            hover:bg-[#f5f1e8]
                            dark:hover:bg-gray-750
                            hover:border-[#aeb8a1]
                            dark:hover:border-gray-600
                            transition-all
                          "
                        >

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={
                              currentUploadType?.accept
                            }
                            onChange={
                              handleFileChange
                            }
                            className="hidden"
                          />

                          <div
                            className="
                              w-14
                              h-14
                              rounded-2xl
                              bg-[#e6ecdf]
                              dark:bg-gray-700
                              flex
                              items-center
                              justify-center
                              mx-auto
                              mb-4
                            "
                          >
                            <Upload
                              size={25}
                              className="
                                text-[#6f8061]
                                dark:text-[#aeb8a1]
                              "
                            />
                          </div>

                          <p
                            className="
                              font-semibold
                              text-[#4d5047]
                              dark:text-gray-200
                            "
                          >
                            Drop your lecture here
                          </p>

                          <p
                            className="
                              text-sm
                              text-[#85877d]
                              dark:text-gray-400
                              mt-1
                            "
                          >
                            or click to browse your
                            computer
                          </p>

                          <p
                            className="
                              text-xs
                              text-[#aaa69c]
                              dark:text-gray-500
                              mt-4
                            "
                          >
                            {
                              currentUploadType?.description
                            }
                          </p>

                        </div>

                      ) : (

                        <div
                          className="
                            border
                            border-[#d8d1c4]
                            dark:border-gray-700
                            rounded-2xl
                            p-5
                            bg-[#faf7f0]
                            dark:bg-gray-800
                          "
                        >

                          <div className="flex items-center gap-4">

                            <div
                              className="
                                w-12
                                h-12
                                rounded-xl
                                bg-[#e6ecdf]
                                dark:bg-gray-700
                                flex
                                items-center
                                justify-center
                              "
                            >
                              <FileCheck
                                size={23}
                                className="
                                  text-[#6f8061]
                                  dark:text-[#aeb8a1]
                                "
                              />
                            </div>

                            <div className="flex-1 min-w-0">

                              <p
                                className="
                                  font-semibold
                                  text-[#4d5047]
                                  dark:text-gray-200
                                  truncate
                                "
                              >
                                {selectedFile.name}
                              </p>

                              <p
                                className="
                                  text-xs
                                  text-[#85877d]
                                  dark:text-gray-400
                                  mt-1
                                "
                              >
                                {formatFileSize(
                                  selectedFile.size
                                )}
                              </p>

                            </div>

                            <button
                              type="button"
                              onClick={
                                removeFile
                              }
                              className="
                                w-9
                                h-9
                                rounded-lg
                                flex
                                items-center
                                justify-center
                                text-[#85877d]
                                dark:text-gray-400
                                hover:bg-[#eee9df]
                                dark:hover:bg-gray-700
                                hover:text-[#c98262]
                              "
                            >
                              <X size={18} />
                            </button>

                          </div>

                        </div>
                      )}

                    </div>
                  )}

                  {/* PREPARE BUTTON */}

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="
                      w-full
                      h-14
                      rounded-xl
                      bg-[#6f8061]
                      dark:bg-[#6f8061]
                      text-[#fffdf8]
                      font-semibold
                      tracking-wide
                      flex
                      items-center
                      justify-center
                      gap-3
                      hover:bg-[#5d6e51]
                      dark:hover:bg-[#7f906f]
                      hover:-translate-y-0.5
                      transition-all
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                    "
                  >

                    {uploading ? (
                      <>
                        <Loader2
                          size={20}
                          className="animate-spin"
                        />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Brain size={20} />
                        Prepare for Learning
                        <ArrowRight
                          size={19}
                        />
                      </>
                    )}

                  </button>

                </div>
              </Card>

              {/* SIDEBAR */}

              <div className="space-y-6">

                <Card
                  className="
                    p-6
                    bg-[#fffdf8]
                    dark:bg-gray-900
                    border-[#e4ded2]
                    dark:border-gray-800
                    shadow-sm
                    dark:shadow-none
                  "
                >

                  <h2
                    className="
                      font-display
                      text-xl
                      text-[#3e4038]
                      dark:text-gray-100
                      mb-2
                    "
                  >
                    Choose your format
                  </h2>

                  <p
                    className="
                      text-sm
                      text-[#85877d]
                      dark:text-gray-400
                      mb-5
                    "
                  >
                    How would you like to provide
                    your lecture?
                  </p>

                  <div className="space-y-2">

                    {uploadTypes.map(
                      (type) => {

                        const Icon = type.icon;

                        const active =
                          selectedType ===
                          type.id;

                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() =>
                              handleTypeChange(
                                type.id
                              )
                            }
                            className={cn(
                              `
                                w-full
                                flex
                                items-center
                                gap-3
                                p-3
                                rounded-xl
                                border
                                text-left
                                transition-all
                              `,
                              active
                                ? `
                                  border-[#aeb8a1]
                                  dark:border-[#6f8061]
                                  bg-[#e6ecdf]
                                  dark:bg-gray-800
                                `
                                : `
                                  border-[#e4ded2]
                                  dark:border-gray-800
                                  bg-[#fffdf8]
                                  dark:bg-gray-900
                                  hover:bg-[#faf7f0]
                                  dark:hover:bg-gray-800
                                `
                            )}
                          >

                            <div
                              className={cn(
                                `
                                  w-9
                                  h-9
                                  rounded-lg
                                  flex
                                  items-center
                                  justify-center
                                `,
                                active
                                  ? `
                                    bg-[#6f8061]
                                    text-[#fffdf8]
                                  `
                                  : `
                                    bg-[#eee9df]
                                    dark:bg-gray-800
                                    text-[#85877d]
                                    dark:text-gray-400
                                  `
                              )}
                            >
                              <Icon size={17} />
                            </div>

                            <div className="flex-1">

                              <p
                                className={cn(
                                  "text-sm font-semibold",
                                  active
                                    ? `
                                      text-[#4d6041]
                                      dark:text-[#c8d2c0]
                                    `
                                    : `
                                      text-[#4d5047]
                                      dark:text-gray-200
                                    `
                                )}
                              >
                                {type.name}
                              </p>

                              <p
                                className="
                                  text-xs
                                  text-[#85877d]
                                  dark:text-gray-400
                                "
                              >
                                {type.description}
                              </p>

                            </div>

                            {active && (
                              <CheckCircle
                                size={18}
                                className="
                                  text-[#6f8061]
                                  dark:text-[#aeb8a1]
                                "
                              />
                            )}

                          </button>
                        );
                      }
                    )}

                  </div>
                </Card>

                {/* INFO */}

                <div
                  className="
                    rounded-2xl
                    bg-[#e6ecdf]
                    dark:bg-gray-800
                    border
                    border-[#d5ddcc]
                    dark:border-gray-700
                    p-6
                  "
                >

                  <div
                    className="
                      w-10
                      h-10
                      rounded-xl
                      bg-[#fffdf8]
                      dark:bg-gray-900
                      flex
                      items-center
                      justify-center
                      mb-4
                    "
                  >
                    <Sparkles
                      size={19}
                      className="
                        text-[#6f8061]
                        dark:text-[#aeb8a1]
                      "
                    />
                  </div>

                  <h3
                    className="
                      font-semibold
                      text-[#4d5047]
                      dark:text-gray-200
                    "
                  >
                    What happens next?
                  </h3>

                  <p
                    className="
                      text-sm
                      text-[#73766b]
                      dark:text-gray-400
                      mt-2
                      leading-relaxed
                    "
                  >
                    TwinLearnAI extracts your
                    lecture content, understands
                    the topics, creates searchable
                    knowledge, and prepares your
                    AI Professor to teach you.
                  </p>

                  <div
                    className="
                      mt-4
                      space-y-2
                      text-xs
                      text-[#6f7068]
                      dark:text-gray-400
                    "
                  >

                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} />
                      Content extraction
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} />
                      Topic analysis
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} />
                      Semantic search
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} />
                      AI Professor ready
                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}

/*
|--------------------------------------------------------------------------
| PROCESSING VIEW
|--------------------------------------------------------------------------
*/

function ProcessingView({ currentStage }) {
  const progress =
    ((currentStage + 1) /
      processingStages.length) *
    100;

  return (
    <Card
      className="
        max-w-3xl
        mx-auto
        p-8
        md:p-10
        bg-[#fffdf8]
        dark:bg-gray-900
        border-[#e4ded2]
        dark:border-gray-800
        shadow-sm
        dark:shadow-none
      "
    >

      <div className="text-center mb-10">

        <div
          className="
            w-16
            h-16
            rounded-2xl
            bg-[#e6ecdf]
            dark:bg-gray-800
            flex
            items-center
            justify-center
            mx-auto
            mb-5
          "
        >
          <Loader2
            size={30}
            className="
              text-[#6f8061]
              dark:text-[#aeb8a1]
              animate-spin
            "
          />
        </div>

        <p
          className="
            text-xs
            uppercase
            tracking-[0.2em]
            text-[#c98262]
            dark:text-[#e2a082]
            font-semibold
            mb-2
          "
        >
          Preparing your classroom
        </p>

        <h2
          className="
            font-display
            text-3xl
            text-[#3e4038]
            dark:text-gray-100
          "
        >
          Processing your lecture...
        </h2>

        <p
          className="
            text-[#85877d]
            dark:text-gray-400
            mt-2
          "
        >
          Please wait while TwinLearnAI
          prepares your lecture.
        </p>

      </div>

      <div className="mb-8">

        <div
          className="
            flex
            justify-between
            text-xs
            text-[#85877d]
            dark:text-gray-400
            mb-2
          "
        >

          <span>
            {processingStages[currentStage]?.label}
          </span>

          <span>
            {Math.round(progress)}%
          </span>

        </div>

        <div
          className="
            h-2
            bg-[#eee9df]
            dark:bg-gray-800
            rounded-full
            overflow-hidden
          "
        >

          <div
            className="
              h-full
              bg-[#6f8061]
              rounded-full
              transition-all
              duration-500
            "
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      <div className="space-y-3">

        {processingStages.map(
          (stage, index) => {

            const completed =
              index < currentStage;

            const active =
              index === currentStage;

            return (
              <div
                key={stage.label}
                className={cn(
                  `
                    flex
                    items-center
                    gap-4
                    p-4
                    rounded-xl
                    border
                    transition-all
                  `,
                  completed
                    ? `
                      bg-[#e6ecdf]
                      dark:bg-gray-800
                      border-[#d5ddcc]
                      dark:border-gray-700
                    `
                    : active
                    ? `
                      bg-[#faf7f0]
                      dark:bg-gray-800
                      border-[#cfc9bc]
                      dark:border-gray-700
                    `
                    : `
                      bg-[#fffdf8]
                      dark:bg-gray-900
                      border-[#eee9df]
                      dark:border-gray-800
                    `
                )}
              >

                <div
                  className={cn(
                    `
                      w-10
                      h-10
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      text-lg
                    `,
                    completed
                      ? "bg-[#6f8061]"
                      : active
                      ? `
                        bg-[#f3e8df]
                        dark:bg-orange-950/30
                      `
                      : `
                        bg-[#eee9df]
                        dark:bg-gray-800
                      `
                  )}
                >

                  {completed ? (
                    <CheckCircle
                      size={19}
                      className="text-[#fffdf8]"
                    />
                  ) : (
                    stage.icon
                  )}

                </div>

                <div className="flex-1">

                  <p
                    className={cn(
                      "font-semibold text-sm",
                      active || completed
                        ? `
                          text-[#4d5047]
                          dark:text-gray-200
                        `
                        : `
                          text-[#aaa69c]
                          dark:text-gray-600
                        `
                    )}
                  >
                    {stage.label}
                  </p>

                  <p
                    className="
                      text-xs
                      text-[#85877d]
                      dark:text-gray-400
                      mt-0.5
                    "
                  >
                    {stage.description}
                  </p>

                </div>

                {active && (
                  <Loader2
                    size={18}
                    className="
                      text-[#6f8061]
                      dark:text-[#aeb8a1]
                      animate-spin
                    "
                  />
                )}

              </div>
            );
          }
        )}

      </div>
    </Card>
  );
}

/*
|--------------------------------------------------------------------------
| SUCCESS VIEW
|--------------------------------------------------------------------------
*/

function SuccessView({
  lectureResult,
  onStartLearning,
  onUploadAnother,
}) {
  const lectureId =
    lectureResult?.lecture_id ||
    lectureResult?.id ||
    lectureResult?.lecture?.lecture_id ||
    lectureResult?.lecture?.id ||
    lectureResult?.data?.lecture_id ||
    lectureResult?.data?.id ||
    lectureResult?.result?.lecture_id ||
    lectureResult?.result?.id;

  const topic =
    lectureResult?.topic ||
    lectureResult?.lecture?.topic ||
    lectureResult?.data?.topic ||
    "Lecture ready";

  const difficulty =
    lectureResult?.difficulty ||
    lectureResult?.lecture?.difficulty ||
    lectureResult?.data?.difficulty ||
    "Not specified";

  const keywords =
    lectureResult?.keywords ||
    lectureResult?.lecture?.keywords ||
    lectureResult?.data?.keywords ||
    [];

  const objectives =
    lectureResult?.learning_objectives ||
    lectureResult?.objectives ||
    lectureResult?.lecture?.learning_objectives ||
    lectureResult?.data?.learning_objectives ||
    [];

  return (
    <Card
      className="
        max-w-4xl
        mx-auto
        p-8
        md:p-10
        bg-[#fffdf8]
        dark:bg-gray-900
        border-[#e4ded2]
        dark:border-gray-800
        shadow-sm
        dark:shadow-none
      "
    >

      <div className="text-center mb-10">

        <div
          className="
            w-20
            h-20
            rounded-full
            bg-[#e6ecdf]
            dark:bg-gray-800
            flex
            items-center
            justify-center
            mx-auto
            mb-5
          "
        >

          <CheckCircle
            size={40}
            className="
              text-[#6f8061]
              dark:text-[#aeb8a1]
            "
          />

        </div>

        <p
          className="
            text-xs
            uppercase
            tracking-[0.2em]
            text-[#c98262]
            dark:text-[#e2a082]
            font-semibold
            mb-2
          "
        >
          Ready to learn
        </p>

        <h2
          className="
            font-display
            text-4xl
            text-[#3e4038]
            dark:text-gray-100
          "
        >
          Your lecture is ready.
        </h2>

        <p
          className="
            text-[#85877d]
            dark:text-gray-400
            mt-3
            max-w-xl
            mx-auto
          "
        >
          Your lecture has been processed
          and prepared for your personalized
          AI Professor.
        </p>

      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">

        <InfoBox
          label="Topic"
          value={topic}
        />

        <InfoBox
          label="Difficulty"
          value={difficulty}
        />

        <InfoBox
          label="Keywords"
          value={
            Array.isArray(keywords)
              ? `${keywords.length} identified`
              : "Analyzed"
          }
        />

      </div>

      {Array.isArray(objectives) &&
        objectives.length > 0 && (

          <div className="mb-8">

            <h3
              className="
                font-display
                text-xl
                text-[#3e4038]
                dark:text-gray-100
                mb-4
              "
            >
              Learning objectives
            </h3>

            <div className="space-y-2">

              {objectives.map(
                (objective, index) => (

                  <div
                    key={index}
                    className="
                      flex
                      items-start
                      gap-3
                      p-3
                      rounded-xl
                      bg-[#faf7f0]
                      dark:bg-gray-800
                    "
                  >

                    <CheckCircle
                      size={17}
                      className="
                        text-[#6f8061]
                        dark:text-[#aeb8a1]
                        mt-0.5
                        shrink-0
                      "
                    />

                    <span
                      className="
                        text-sm
                        text-[#666960]
                        dark:text-gray-300
                      "
                    >
                      {typeof objective ===
                      "string"
                        ? objective
                        : JSON.stringify(
                            objective
                          )}
                    </span>

                  </div>
                )
              )}

            </div>

          </div>
        )}

      {lectureId && (

        <div
          className="
            mb-8
            p-4
            rounded-xl
            bg-[#f5f1e8]
            dark:bg-gray-800
            border
            border-[#e4ded2]
            dark:border-gray-700
          "
        >

          <p
            className="
              text-xs
              uppercase
              tracking-wider
              text-[#aaa69c]
              dark:text-gray-500
              mb-1
            "
          >
            Lecture ID
          </p>

          <p
            className="
              text-xs
              font-mono
              text-[#73766b]
              dark:text-gray-400
              break-all
            "
          >
            {lectureId}
          </p>

        </div>
      )}

      {!lectureId && (

        <div
          className="
            mb-8
            p-4
            rounded-xl
            bg-[#f3e8df]
            dark:bg-orange-950/30
            border
            border-[#ead7ca]
            dark:border-orange-900/50
          "
        >

          <p
            className="
              text-sm
              font-semibold
              text-[#8c604c]
              dark:text-orange-300
            "
          >
            Lecture ID was not returned by the backend.
          </p>

          <p
            className="
              text-xs
              text-[#85877d]
              dark:text-gray-400
              mt-1
            "
          >
            The lecture may have been processed, but
            AI Professor cannot be opened until a
            lecture ID is returned.
          </p>

        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">

        <button
          type="button"
          onClick={onStartLearning}
          disabled={!lectureId}
          className="
            flex-1
            h-13
            rounded-xl
            bg-[#6f8061]
            text-[#fffdf8]
            font-semibold
            flex
            items-center
            justify-center
            gap-2
            hover:bg-[#5d6e51]
            dark:hover:bg-[#7f906f]
            hover:-translate-y-0.5
            transition-all
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >
          Start Learning
          <ArrowRight size={19} />
        </button>

        <button
          type="button"
          onClick={onUploadAnother}
          className="
            flex-1
            h-13
            rounded-xl
            border
            border-[#cfc9bc]
            dark:border-gray-700
            bg-[#fffdf8]
            dark:bg-gray-900
            text-[#4d5047]
            dark:text-gray-200
            font-semibold
            hover:bg-[#eee9df]
            dark:hover:bg-gray-800
            transition-all
          "
        >
          Upload Another
        </button>

      </div>

    </Card>
  );
}

/*
|--------------------------------------------------------------------------
| INFO BOX
|--------------------------------------------------------------------------
*/

function InfoBox({ label, value }) {
  return (
    <div
      className="
        p-5
        rounded-xl
        bg-[#faf7f0]
        dark:bg-gray-800
        border
        border-[#e4ded2]
        dark:border-gray-700
      "
    >

      <p
        className="
          text-xs
          uppercase
          tracking-wider
          text-[#aaa69c]
          dark:text-gray-500
          mb-2
        "
      >
        {label}
      </p>

      <p
        className="
          font-semibold
          text-[#4d5047]
          dark:text-gray-200
          truncate
        "
      >
        {value}
      </p>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function formatFileSize(bytes) {
  if (!bytes) {
    return "Unknown size";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  let size = bytes;
  let unitIndex = 0;

  while (
    size >= 1024 &&
    unitIndex < units.length - 1
  ) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(
    unitIndex === 0 ? 0 : 1
  )} ${units[unitIndex]}`;
}

function wait(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}