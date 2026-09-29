import React, {
  useState,
  useEffect,
  useRef,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import { DashboardLayout } from "../components/Layout";

import lectureService from "../services/lectureService";
import { ragService } from "../services/ragService";

import {
  Card,
  Button,
  Input,
  Loading,
  Select,
} from "../components/UI";

import {
  Send,
  BookMarked,
  Copy,
  Check,
  Volume2,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

import {
  teachingStrategies,
} from "../data/mockData";

import clsx from "clsx";


export default function AIProfessorPage() {

  // ============================================================
  // ROUTER
  // ============================================================

  const {
    lectureId: urlLectureId,
  } = useParams();

  const navigate = useNavigate();


  // ============================================================
  // STATE
  // ============================================================

  const [lectures, setLectures] = useState([]);

  const [selectedLecture, setSelectedLecture] =
    useState(null);

  const [strategy, setStrategy] =
    useState("story based");

  const [messages, setMessages] =
    useState([]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [lectureLoading, setLectureLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [copiedId, setCopiedId] =
    useState(null);

  const messagesEndRef =
    useRef(null);


  // ============================================================
  // GET LECTURE ID
  // ============================================================

  const getLectureId = (lecture) => {

    return (
      lecture?.lecture_id ||
      lecture?.id ||
      lecture?.uuid ||
      null
    );

  };


  // ============================================================
  // GET LECTURE TITLE
  // ============================================================

  const getLectureTitle = (lecture) => {

    return (
      lecture?.title ||
      lecture?.filename ||
      lecture?.topic ||
      "Untitled Lecture"
    );

  };


  // ============================================================
  // LOAD LECTURES
  // ============================================================

  useEffect(() => {

    loadLectures();

  }, [urlLectureId]);


  // ============================================================
  // AUTO SCROLL CHAT
  // ============================================================

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });

  }, [messages, loading]);


  // ============================================================
  // WELCOME MESSAGE
  // ============================================================

  const createWelcomeMessage = (lecture) => {

    return {

      id: `assistant-${Date.now()}`,

      role: "assistant",

      content:
        `Hello! I'm your AI Twin Professor. Ask me anything about "${getLectureTitle(
          lecture
        )}".`,

      timestamp: new Date(),

    };

  };


  // ============================================================
  // LOAD LECTURES
  // ============================================================

  const loadLectures = async () => {

    setLectureLoading(true);

    setErrorMessage("");

    try {

      console.log(
        "========================================"
      );

      console.log(
        "AI PROFESSOR - LOAD LECTURES"
      );

      console.log(
        "URL LECTURE ID:",
        urlLectureId
      );

      console.log(
        "========================================"
      );


      const result =
        await lectureService.getLectures();


      console.log(
        "AI PROFESSOR LECTURES RESULT:",
        result
      );


      // --------------------------------------------------------
      // VALIDATE RESPONSE
      // --------------------------------------------------------

      if (
        !result?.success ||
        !Array.isArray(result.data)
      ) {

        setLectures([]);

        setSelectedLecture(null);

        setErrorMessage(
          result?.error ||
          "Could not load your lectures."
        );

        return;

      }


      const lectureList =
        result.data;


      setLectures(
        lectureList
      );


      // ========================================================
      // URL CONTAINS LECTURE ID
      // ========================================================

      if (urlLectureId) {

        const matchingLecture =
          lectureList.find(
            (lecture) => {

              const id =
                getLectureId(
                  lecture
                );

              return (
                String(id) ===
                String(urlLectureId)
              );

            }
          );


        console.log(
          "MATCHING LECTURE:",
          matchingLecture
        );


        if (matchingLecture) {

          setSelectedLecture(
            matchingLecture
          );

          setMessages([
            createWelcomeMessage(
              matchingLecture
            ),
          ]);

        } else {

          setSelectedLecture(null);

          setMessages([]);

          setErrorMessage(
            `Lecture "${urlLectureId}" was not found in your lectures.`
          );

        }

        return;

      }


      // ========================================================
      // NO URL LECTURE ID
      // ========================================================

      if (lectureList.length > 0) {

        const firstLecture =
          lectureList[0];

        setSelectedLecture(
          firstLecture
        );

        setMessages([
          createWelcomeMessage(
            firstLecture
          ),
        ]);

      } else {

        setSelectedLecture(null);

        setMessages([]);

      }

    } catch (error) {

      console.error(
        "AI Professor load failed:",
        error
      );


      setSelectedLecture(null);

      setLectures([]);

      setMessages([]);


      setErrorMessage(
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load AI Professor."
      );

    } finally {

      setLectureLoading(false);

    }

  };


  // ============================================================
  // SELECT LECTURE
  // ============================================================

  const handleSelectLecture = (lecture) => {

    const lectureId =
      getLectureId(
        lecture
      );


    if (!lectureId) {

      setErrorMessage(
        "This lecture does not have a valid lecture ID."
      );

      return;

    }


    setSelectedLecture(
      lecture
    );


    setMessages([
      createWelcomeMessage(
        lecture
      ),
    ]);


    setInput("");

    setErrorMessage("");


    navigate(
      `/ai-professor/${lectureId}`,
      {
        replace: true,
      }
    );

  };


  // ============================================================
  // SEND QUESTION
  // ============================================================

  const handleSendMessage = async () => {

    if (
      !input.trim() ||
      !selectedLecture ||
      loading
    ) {

      return;

    }


    const selectedLectureId =
      getLectureId(
        selectedLecture
      );


    if (!selectedLectureId) {

      setErrorMessage(
        "This lecture does not have a valid lecture ID."
      );

      return;

    }


    const question =
      input.trim();


    // ----------------------------------------------------------
    // USER MESSAGE
    // ----------------------------------------------------------

    const userMessage = {

      id: `user-${Date.now()}`,

      role: "user",

      content: question,

      timestamp: new Date(),

    };


    setMessages(
      prev => [
        ...prev,
        userMessage,
      ]
    );


    setInput("");

    setLoading(true);

    setErrorMessage("");


    try {

      console.log(
        "========================================"
      );

      console.log(
        "RAG REQUEST"
      );

      console.log(
        "========================================"
      );


      console.log({

        lecture_id:
          selectedLectureId,

        question,

        teaching_strategy:
          strategy,

      });


      // --------------------------------------------------------
      // SEND QUESTION TO BACKEND
      // --------------------------------------------------------

      const result =
        await ragService.askQuestion(
          selectedLectureId,
          question,
          strategy
        );


      console.log(
        "RAG RESPONSE:",
        result
      );


      // ========================================================
      // SUCCESS
      // ========================================================

      if (result?.success) {

        const data =
          result.data || {};


        const aiMessage = {

          id:
            `ai-${Date.now()}`,

          role:
            "assistant",

          content:
            data.answer ||
            "I could not generate an answer.",

          sources:
            data.sources ||
            [],

          retrievedChunks:
            data.retrieved_chunks ??
            data.retrievedChunks ??
            0,

          grounded:
            data.grounded ??
            false,

          strategy:
            data.strategy ||
            strategy,

          timestamp:
            new Date(),

        };


        setMessages(
          prev => [
            ...prev,
            aiMessage,
          ]
        );

      }

      // ========================================================
      // BACKEND ERROR
      // ========================================================

      else {

        const errorText =
          result?.error ||
          "Sorry, I could not generate an answer.";


        setMessages(
          prev => [
            ...prev,
            {

              id:
                `error-${Date.now()}`,

              role:
                "assistant",

              content:
                errorText,

              timestamp:
                new Date(),

            },
          ]
        );

      }

    } catch (error) {

      console.error(
        "RAG question failed:",
        error
      );


      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong while communicating with the AI Professor.";


      setMessages(
        prev => [
          ...prev,
          {

            id:
              `error-${Date.now()}`,

            role:
              "assistant",

            content:
              typeof detail === "string"
                ? detail
                : JSON.stringify(detail),

            timestamp:
              new Date(),

          },
        ]
      );

    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // COPY
  // ============================================================

  const copyToClipboard = (
    text,
    id
  ) => {

    navigator.clipboard.writeText(
      text
    );


    setCopiedId(id);


    setTimeout(
      () => setCopiedId(null),
      2000
    );

  };


  // ============================================================
  // RENDER CONTENT
  // ============================================================

  const renderMessageContent = (
    content,
    role
  ) => {

    return (

      <p
        className={clsx(

          `
            whitespace-pre-wrap
            leading-relaxed
            break-words
          `,

          role === "user"

            ? `
              text-[#f7f3ea]
              dark:text-white
            `

            : `
              text-[#4d5047]
              dark:text-gray-100
            `

        )}
      >
        {content}
      </p>

    );

  };


  // ============================================================
  // SOURCES
  // ============================================================

  const renderSources = (
    sources
  ) => {

    if (
      !Array.isArray(sources) ||
      sources.length === 0
    ) {

      return null;

    }


    return (

      <div className="mt-4">

        <p
          className="
            font-semibold
            mb-2
            text-[#4d5047]
            dark:text-gray-200
          "
        >
          Sources
        </p>


        <div className="space-y-2">

          {sources.map(
            (
              source,
              index
            ) => {

              const sourceKey =
                source?.chunkId ||
                source?.chunk_id ||
                source?.id ||
                `source-${index}`;


              const lectureTitle =
                source?.lectureTitle ||
                source?.lecture_title ||
                source?.title ||
                "Lecture";


              const sourceFile =
                source?.sourceFile ||
                source?.source_file;


              const chunkNumber =
                source?.chunkNumber ??
                source?.chunk_number;


              return (

                <div
                  key={sourceKey}
                  className="
                    text-xs
                    text-[#73766b]
                    dark:text-gray-400
                    bg-[#faf7f0]
                    dark:bg-gray-800
                    rounded-xl
                    p-3
                    border
                    border-[#e4ded2]
                    dark:border-gray-700
                  "
                >

                  <p>

                    <span
                      className="
                        font-semibold
                        text-[#4d5047]
                        dark:text-gray-200
                      "
                    >
                      {lectureTitle}
                    </span>

                  </p>


                  {sourceFile && (

                    <p className="mt-1">

                      File:{" "}
                      {sourceFile}

                    </p>

                  )}


                  {chunkNumber !==
                    undefined &&
                    chunkNumber !==
                    null && (

                    <p>

                      Chunk:{" "}
                      {chunkNumber}

                    </p>

                  )}


                  {source?.relevance !==
                    undefined &&
                    source?.relevance !==
                    null && (

                    <p>

                      Relevance:{" "}
                      {Number(
                        source.relevance
                      ).toFixed(2)}

                    </p>

                  )}

                </div>

              );

            }
          )}

        </div>

      </div>

    );

  };


  // ============================================================
  // QUICK QUESTION
  // ============================================================

  const handleQuickQuestion = (
    question
  ) => {

    setInput(question);

  };


  // ============================================================
  // ENTER
  // ============================================================

  const handleKeyDown = (
    event
  ) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      handleSendMessage();

    }

  };


  // ============================================================
  // LOADING
  // ============================================================

  if (lectureLoading) {

    return (

      <DashboardLayout>

        <div
          className="
            min-h-[60vh]
            flex
            flex-col
            items-center
            justify-center
            bg-[#f7f3ea]
            dark:bg-gray-950
          "
        >

          <Loading size="lg" />

          <p
            className="
              mt-4
              text-[#7d7d72]
              dark:text-gray-400
            "
          >
            Loading AI Professor...
          </p>

        </div>

      </DashboardLayout>

    );

  }


  // ============================================================
  // ERROR
  // ============================================================

  if (
    errorMessage &&
    !selectedLecture
  ) {

    return (

      <DashboardLayout>

        <div
          className="
            space-y-6
            bg-[#f7f3ea]
            dark:bg-gray-950
            min-h-full
          "
        >

          <Button
            variant="secondary"
            onClick={() =>
              navigate("/lectures")
            }
          >

            <ArrowLeft size={18} />

            Back to My Lectures

          </Button>


          <Card
            className="
              p-10
              text-center
              bg-[#fffdf8]
              dark:bg-gray-900
              border-[#e4ded2]
              dark:border-gray-700
            "
          >

            <Sparkles
              size={48}
              className="
                mx-auto
                mb-4
                text-[#6f8061]
                dark:text-[#aeb8a1]
              "
            />


            <h1
              className="
                text-2xl
                font-bold
                text-[#3e4038]
                dark:text-gray-100
              "
            >
              AI Professor could not load
            </h1>


            <p
              className="
                mt-3
                text-[#7d7d72]
                dark:text-gray-400
              "
            >
              {errorMessage}
            </p>


            <div
              className="
                mt-6
                flex
                justify-center
                gap-3
              "
            >

              <Button
                variant="secondary"
                onClick={() =>
                  navigate("/lectures")
                }
              >
                My Lectures
              </Button>


              <Button
                variant="primary"
                onClick={loadLectures}
              >
                Try Again
              </Button>

            </div>

          </Card>

        </div>

      </DashboardLayout>

    );

  }


  // ============================================================
  // NO LECTURES
  // ============================================================

  if (
    lectures.length === 0
  ) {

    return (

      <DashboardLayout>

        <Card
          className="
            p-10
            text-center
            bg-[#fffdf8]
            dark:bg-gray-900
            border-[#e4ded2]
            dark:border-gray-700
          "
        >

          <Sparkles
            size={48}
            className="
              mx-auto
              mb-4
              text-[#6f8061]
              dark:text-[#aeb8a1]
            "
          />


          <h1
            className="
              text-2xl
              font-bold
              text-[#3e4038]
              dark:text-gray-100
            "
          >
            No lectures available
          </h1>


          <p
            className="
              mt-3
              text-[#7d7d72]
              dark:text-gray-400
            "
          >
            Upload a lecture first to start learning.
          </p>


          <Button
            variant="primary"
            className="mt-6"
            onClick={() =>
              navigate("/upload")
            }
          >
            Upload Lecture
          </Button>

        </Card>

      </DashboardLayout>

    );

  }


  // ============================================================
  // MAIN UI
  // ============================================================

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
            max-w-[1500px]
            mx-auto
            px-4
            sm:px-6
            lg:px-8
            py-6
          "
        >

          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className="mb-5">

            <div
              className="
                flex
                items-center
                gap-3
                mb-2
              "
            >

              {/* BACK BUTTON */}

              <button
                type="button"
                onClick={() =>
                  navigate("/lectures")
                }
                className="
                  w-9
                  h-9
                  rounded-lg
                  bg-[#fffdf8]
                  dark:bg-gray-800
                  border
                  border-[#e4ded2]
                  dark:border-gray-700
                  flex
                  items-center
                  justify-center
                  text-[#6f8061]
                  dark:text-[#aeb8a1]
                  hover:bg-[#e6ecdf]
                  dark:hover:bg-gray-700
                  transition
                "
              >

                <ArrowLeft size={18} />

              </button>


              {/* AI ICON */}

              <div
                className="
                  w-9
                  h-9
                  rounded-lg
                  bg-[#e6ecdf]
                  dark:bg-[#34402f]
                  flex
                  items-center
                  justify-center
                "
              >

                <Sparkles
                  size={18}
                  className="
                    text-[#6f8061]
                    dark:text-[#aeb8a1]
                  "
                />

              </div>


              <div>

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.2em]
                    text-[#c98262]
                    dark:text-[#d99a7c]
                  "
                >
                  AI Professor
                </p>

                <h1
                  className="
                    font-display
                    text-3xl
                    md:text-4xl
                    text-[#3e4038]
                    dark:text-gray-100
                  "
                >
                  Your personal classroom.
                </h1>

              </div>

            </div>


            <p
              className="
                text-[#7d7d72]
                dark:text-gray-400
                ml-12
              "
            >
              Learn from your lecture with a personalized AI Professor.
            </p>


            {errorMessage && (

              <div
                className="
                  mt-3
                  ml-12
                  p-3
                  rounded-lg
                  bg-[#f3e8df]
                  dark:bg-[#3a2c26]
                  border
                  border-[#ead7ca]
                  dark:border-[#5a4034]
                  text-[#8c604c]
                  dark:text-[#e7b49b]
                  text-sm
                "
              >
                {errorMessage}
              </div>

            )}

          </div>


          {/* ====================================================
              MAIN GRID
          ==================================================== */}

          <div
            className="
              grid
              lg:grid-cols-[320px_minmax(0,1fr)]
              gap-5
              items-stretch
              h-[calc(100vh-245px)]
              min-h-[620px]
            "
          >

            {/* ==================================================
                LECTURE SIDEBAR
            ================================================== */}

            <Card
              className="
                h-full
                min-h-0
                p-4
                flex
                flex-col
                bg-[#fffdf8]
                dark:bg-gray-900
                border-[#e4ded2]
                dark:border-gray-700
                shadow-sm
              "
            >

              <div className="mb-4">

                <h2
                  className="
                    font-display
                    text-xl
                    text-[#3e4038]
                    dark:text-gray-100
                  "
                >
                  Your lectures
                </h2>

                <p
                  className="
                    text-xs
                    text-[#85877d]
                    dark:text-gray-400
                    mt-1
                  "
                >
                  Choose a lecture to begin.
                </p>

              </div>


              {/* LECTURE LIST */}

              <div
                className="
                  flex-1
                  min-h-0
                  overflow-y-auto
                  pr-1
                  space-y-2
                "
              >

                {lectures.map(
                  (
                    lecture,
                    index
                  ) => {

                    const id =
                      getLectureId(
                        lecture
                      );


                    const isSelected =
                      String(
                        getLectureId(
                          selectedLecture
                        )
                      ) ===
                      String(id);


                    return (

                      <button
                        key={
                          id ||
                          `lecture-${index}`
                        }

                        onClick={() =>
                          handleSelectLecture(
                            lecture
                          )
                        }

                        className={clsx(

                          `
                            w-full
                            text-left
                            p-3
                            rounded-xl
                            transition-all
                            border
                          `,

                          isSelected

                            ? `
                              border-[#aeb8a1]
                              dark:border-[#718064]
                              bg-[#e6ecdf]
                              dark:bg-[#34402f]
                            `

                            : `
                              border-[#e4ded2]
                              dark:border-gray-700
                              bg-[#fffdf8]
                              dark:bg-gray-900
                              hover:bg-[#faf7f0]
                              dark:hover:bg-gray-800
                              hover:border-[#cfc9bc]
                              dark:hover:border-gray-600
                            `

                        )}
                      >

                        <p
                          className="
                            font-semibold
                            text-sm
                            text-[#4d5047]
                            dark:text-gray-100
                            truncate
                          "
                        >
                          {getLectureTitle(
                            lecture
                          )}
                        </p>


                        <p
                          className="
                            text-xs
                            text-[#85877d]
                            dark:text-gray-400
                            truncate
                            mt-1
                          "
                        >
                          {lecture?.topic ||
                            "No topic available"}
                        </p>

                      </button>

                    );

                  }
                )}

              </div>


              {/* =================================================
                  TEACHING STRATEGY
              ================================================== */}

              <div
                className="
                  mt-4
                  pt-4
                  border-t
                  border-[#e4ded2]
                  dark:border-gray-700
                "
              >

                <h3
                  className="
                    font-semibold
                    text-sm
                    text-[#4d5047]
                    dark:text-gray-200
                    mb-2
                  "
                >
                  Teaching style
                </h3>


                <Select
                  options={
                    teachingStrategies.map(
                      strategyItem => ({

                        value:
                          strategyItem.id === "step"
                            ? "step by step"
                            : strategyItem.id,

                        label:
                          strategyItem.name,

                      })
                    )
                  }

                  value={
                    strategy
                  }

                  onChange={
                    event =>
                      setStrategy(
                        event.target.value
                      )
                  }
                />


                <p
                  className="
                    text-xs
                    text-[#85877d]
                    dark:text-gray-400
                    mt-2
                    leading-relaxed
                  "
                >

                  {
                    teachingStrategies.find(
                      item => {

                        const itemId =
                          item.id === "step"
                            ? "step by step"
                            : item.id;

                        return (
                          itemId ===
                          strategy
                        );

                      }
                    )?.description
                  }

                </p>


                {strategy === "story based" && (

                  <div
                    className="
                      mt-3
                      px-3
                      py-2
                      rounded-lg
                      bg-[#f3e8df]
                      dark:bg-[#3a2c26]
                      border
                      border-[#ead7ca]
                      dark:border-[#5a4034]
                    "
                  >

                    <p
                      className="
                        text-xs
                        font-semibold
                        text-[#8c604c]
                        dark:text-[#e7b49b]
                      "
                    >
                      Story-based teaching enabled
                    </p>

                    <p
                      className="
                        text-[11px]
                        text-[#85877d]
                        dark:text-gray-400
                        mt-1
                      "
                    >
                      The AI Professor will use
                      relatable examples and stories
                      to explain the lecture.
                    </p>

                  </div>

                )}

              </div>

            </Card>


            {/* ==================================================
                CHAT SECTION
            ================================================== */}

            <Card
              className="
                h-full
                min-h-0
                flex
                flex-col
                overflow-hidden
                bg-[#fffdf8]
                dark:bg-gray-900
                border-[#e4ded2]
                dark:border-gray-700
                shadow-sm
              "
            >

              {/* =================================================
                  CHAT HEADER
              ================================================= */}

              <div
                className="
                  shrink-0
                  border-b
                  border-[#e4ded2]
                  dark:border-gray-700
                  px-5
                  py-4
                  bg-[#fffdf8]
                  dark:bg-gray-900
                "
              >

                {selectedLecture && (

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >

                    <div className="min-w-0">

                      <h2
                        className="
                          font-display
                          text-xl
                          text-[#3e4038]
                          dark:text-gray-100
                          truncate
                        "
                      >
                        {getLectureTitle(
                          selectedLecture
                        )}
                      </h2>


                      <p
                        className="
                          text-sm
                          text-[#85877d]
                          dark:text-gray-400
                          mt-1
                        "
                      >

                        {selectedLecture?.topic ||
                          "No topic"}

                        {" • "}

                        {selectedLecture?.difficulty ||
                          "Unknown difficulty"}

                      </p>

                    </div>


                    <div
                      className="
                        hidden
                        sm:flex
                        items-center
                        gap-2
                        shrink-0
                        px-3
                        py-2
                        rounded-lg
                        bg-[#e6ecdf]
                        dark:bg-[#34402f]
                        text-[#5d6e51]
                        dark:text-[#b7c4ad]
                        text-xs
                        font-semibold
                      "
                    >

                      <Sparkles size={14} />

                      {strategy}

                    </div>

                  </div>

                )}

              </div>


              {/* =================================================
                  MESSAGES
              ================================================= */}

              <div
                className="
                  flex-1
                  min-h-0
                  overflow-y-auto
                  overflow-x-hidden
                  px-5
                  py-5
                  space-y-5
                  bg-[#fcfaf5]
                  dark:bg-gray-950
                  scroll-smooth
                "
              >

                {messages.map(
                  message => (

                    <div
                      key={message.id}
                      className={clsx(
                        "flex gap-3 w-full",

                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      )}
                    >

                      {/* ASSISTANT ICON */}

                      {message.role ===
                        "assistant" && (

                        <div
                          className="
                            w-9
                            h-9
                            bg-[#6f8061]
                            dark:bg-[#5d6e51]
                            rounded-full
                            flex
                            items-center
                            justify-center
                            text-white
                            flex-shrink-0
                            shadow-sm
                          "
                        >

                          <Sparkles size={18} />

                        </div>

                      )}


                      {/* MESSAGE BUBBLE */}

                      <div
                        className={clsx(

                          `
                            rounded-2xl
                            p-4
                            shadow-sm
                            break-words
                          `,

                          message.role === "user"

                            ? `
                              max-w-[75%]
                              bg-[#6f8061]
                              dark:bg-[#5d6e51]
                              text-[#f7f3ea]
                              dark:text-white
                              rounded-br-md
                            `

                            : `
                              max-w-[82%]
                              bg-[#fffdf8]
                              dark:bg-gray-900
                              border
                              border-[#e4ded2]
                              dark:border-gray-700
                              text-[#4d5047]
                              dark:text-gray-100
                              rounded-bl-md
                            `

                        )}
                      >

                        {renderMessageContent(
                          message.content,
                          message.role
                        )}


                        {/* ======================================
                            ASSISTANT ACTIONS
                        ======================================= */}

                        {message.role ===
                          "assistant" && (

                          <div
                            className="
                              mt-4
                              pt-3
                              border-t
                              border-[#e4ded2]
                              dark:border-gray-700
                            "
                          >

                            <div
                              className="
                                flex
                                gap-2
                                flex-wrap
                              "
                            >

                              {/* COPY */}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="
                                  text-xs
                                  dark:text-gray-300
                                "
                                onClick={() =>
                                  copyToClipboard(
                                    message.content,
                                    message.id
                                  )
                                }
                              >

                                {copiedId ===
                                  message.id ? (

                                  <>
                                    <Check size={14} />
                                    Copied
                                  </>

                                ) : (

                                  <>
                                    <Copy size={14} />
                                    Copy
                                  </>

                                )}

                              </Button>


                              {/* READ */}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="
                                  text-xs
                                  dark:text-gray-300
                                "
                                onClick={() => {

                                  if (
                                    "speechSynthesis"
                                    in window
                                  ) {

                                    window
                                      .speechSynthesis
                                      .cancel();


                                    const utterance =
                                      new SpeechSynthesisUtterance(
                                        message.content
                                      );


                                    window
                                      .speechSynthesis
                                      .speak(
                                        utterance
                                      );

                                  }

                                }}
                              >

                                <Volume2 size={14} />

                                Read

                              </Button>


                              {/* BOOKMARK */}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="
                                  text-xs
                                  dark:text-gray-300
                                "
                              >

                                <BookMarked size={14} />

                                Bookmark

                              </Button>

                            </div>


                            {/* SOURCES */}

                            {renderSources(
                              message.sources
                            )}


                            {/* RETRIEVAL STATUS */}

                            {message.retrievedChunks !==
                              undefined && (

                              <div
                                className="
                                  mt-3
                                  text-xs
                                  text-[#85877d]
                                  dark:text-gray-400
                                "
                              >

                                Retrieved chunks:{" "}

                                <span
                                  className="
                                    font-semibold
                                    text-[#4d5047]
                                    dark:text-gray-200
                                  "
                                >
                                  {
                                    message.retrievedChunks
                                  }
                                </span>


                                {" • "}


                                <span
                                  className={
                                    message.grounded

                                      ? `
                                        text-green-600
                                        dark:text-green-400
                                      `

                                      : `
                                        text-orange-600
                                        dark:text-orange-400
                                      `
                                  }
                                >

                                  {message.grounded
                                    ? "Grounded in lecture"
                                    : "Not grounded"}

                                </span>

                              </div>

                            )}

                          </div>

                        )}

                      </div>


                      {/* USER ICON */}

                      {message.role ===
                        "user" && (

                        <div
                          className="
                            w-9
                            h-9
                            bg-[#e6ecdf]
                            dark:bg-[#34402f]
                            border
                            border-[#d5ddcc]
                            dark:border-[#56634d]
                            rounded-full
                            flex
                            items-center
                            justify-center
                            text-[#5d6e51]
                            dark:text-[#b7c4ad]
                            flex-shrink-0
                            text-sm
                            font-bold
                          "
                        >
                          U
                        </div>

                      )}

                    </div>

                  )
                )}


                {/* =================================================
                    LOADING
                ================================================== */}

                {loading && (

                  <div
                    className="
                      flex
                      gap-3
                      items-start
                    "
                  >

                    <div
                      className="
                        w-9
                        h-9
                        bg-[#6f8061]
                        dark:bg-[#5d6e51]
                        rounded-full
                        flex
                        items-center
                        justify-center
                        text-white
                        shrink-0
                      "
                    >

                      <Sparkles size={18} />

                    </div>


                    <div
                      className="
                        bg-[#fffdf8]
                        dark:bg-gray-900
                        border
                        border-[#e4ded2]
                        dark:border-gray-700
                        rounded-2xl
                        rounded-bl-md
                        p-4
                        flex
                        gap-2
                      "
                    >

                      <div
                        className="
                          w-2
                          h-2
                          bg-[#6f8061]
                          dark:bg-[#aeb8a1]
                          rounded-full
                          animate-bounce
                        "
                      />


                      <div
                        className="
                          w-2
                          h-2
                          bg-[#6f8061]
                          dark:bg-[#aeb8a1]
                          rounded-full
                          animate-bounce
                        "
                        style={{
                          animationDelay:
                            "0.2s",
                        }}
                      />


                      <div
                        className="
                          w-2
                          h-2
                          bg-[#6f8061]
                          dark:bg-[#aeb8a1]
                          rounded-full
                          animate-bounce
                        "
                        style={{
                          animationDelay:
                            "0.4s",
                        }}
                      />

                    </div>

                  </div>

                )}


                {/* AUTO SCROLL TARGET */}

                <div
                  ref={messagesEndRef}
                  className="h-1"
                />

              </div>


              {/* =================================================
                  QUICK QUESTIONS
              ================================================= */}

              {messages.length <= 1 && (

                <div
                  className="
                    shrink-0
                    border-t
                    border-[#e4ded2]
                    dark:border-gray-700
                    px-5
                    py-3
                    bg-[#fffdf8]
                    dark:bg-gray-900
                  "
                >

                  <p
                    className="
                      text-xs
                      text-[#85877d]
                      dark:text-gray-400
                      mb-2
                    "
                  >
                    Quick questions:
                  </p>


                  <div
                    className="
                      grid
                      grid-cols-2
                      lg:grid-cols-4
                      gap-2
                    "
                  >

                    {[
                      "What are the key concepts?",
                      "Explain this with a story",
                      "Can you explain it simply?",
                      "What are common mistakes?",
                    ].map(
                      (
                        question,
                        index
                      ) => (

                        <button
                          key={index}
                          onClick={() =>
                            handleQuickQuestion(
                              question
                            )
                          }
                          className="
                            text-left
                            text-xs
                            px-3
                            py-2
                            bg-[#faf7f0]
                            dark:bg-gray-800
                            border
                            border-[#e4ded2]
                            dark:border-gray-700
                            hover:bg-[#e6ecdf]
                            dark:hover:bg-gray-700
                            hover:border-[#d5ddcc]
                            dark:hover:border-gray-600
                            rounded-lg
                            text-[#666960]
                            dark:text-gray-300
                            transition
                            truncate
                          "
                        >
                          {question}
                        </button>

                      )
                    )}

                  </div>

                </div>

              )}


              {/* =================================================
                  INPUT
              ================================================= */}

              <div
                className="
                  shrink-0
                  border-t
                  border-[#e4ded2]
                  dark:border-gray-700
                  p-4
                  bg-[#fffdf8]
                  dark:bg-gray-900
                "
              >

                <div
                  className="
                    flex
                    gap-2
                    items-center
                  "
                >

                  <div className="flex-1">

                    <Input
                      placeholder={
                        selectedLecture
                          ? "Ask anything about this lecture..."
                          : "Select a lecture first..."
                      }

                      value={input}

                      onChange={
                        event =>
                          setInput(
                            event.target.value
                          )
                      }

                      onKeyDown={
                        handleKeyDown
                      }

                      disabled={
                        loading ||
                        !selectedLecture
                      }
                    />

                  </div>


                  <Button
                    variant="primary"
                    size="md"
                    onClick={
                      handleSendMessage
                    }

                    loading={loading}

                    disabled={
                      loading ||
                      !input.trim() ||
                      !selectedLecture
                    }
                  >

                    <Send size={18} />

                  </Button>

                </div>


                <p
                  className="
                    text-[11px]
                    text-[#aaa69c]
                    dark:text-gray-500
                    mt-2
                    text-center
                  "
                >
                  Press Enter to send • Shift + Enter for a new line
                </p>

              </div>

            </Card>

          </div>

        </div>

      </div>

    </DashboardLayout>

  );

}