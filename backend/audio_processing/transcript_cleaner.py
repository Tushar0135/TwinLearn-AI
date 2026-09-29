import re
from typing import Iterable, List, Pattern, Set

from .config import FILLER_WORDS, TECHNICAL_TERMS
from .schemas import TranscriptSegment


class TranscriptCleaningError(Exception):
    pass


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_punctuation_spacing(text: str) -> str:
    text = re.sub(r"\s+([.,!?;:])", r"\1", text)
    text = re.sub(r"([.,!?;:])(\S)", r"\1 \2", text)
    return normalize_whitespace(text)


def _build_word_pattern(words: Iterable[str]) -> Pattern:
    escaped = [re.escape(word) for word in sorted(words, key=len, reverse=True)]
    return re.compile(r"\b(?:" + r"|".join(escaped) + r")\b", flags=re.IGNORECASE)


def remove_filler_words(text: str, filler_words: Set[str]) -> str:
    if not filler_words:
        return text
    pattern = _build_word_pattern(filler_words)
    cleaned = pattern.sub("", text)
    return normalize_whitespace(cleaned)


def collapse_repeated_words(text: str) -> str:
    tokens = text.split()
    if not tokens:
        return text
    cleaned_tokens = [tokens[0]]
    for token in tokens[1:]:
        if token.lower() == cleaned_tokens[-1].lower():
            continue
        cleaned_tokens.append(token)
    return " ".join(cleaned_tokens)


def preserve_technical_terms(text: str, terms: List[str]) -> str:
    if not terms:
        return text
    pattern = _build_word_pattern(terms)

    def replace(match: re.Match) -> str:
        matched = match.group(0)
        for term in terms:
            if matched.lower() == term.lower():
                return term
        return matched

    return pattern.sub(replace, text)


def clean_text(text: str, filler_words: Set[str], technical_terms: List[str]) -> str:
    text = normalize_whitespace(text)
    text = remove_filler_words(text, filler_words)
    text = normalize_whitespace(text)
    text = collapse_repeated_words(text)
    text = normalize_punctuation_spacing(text)
    text = preserve_technical_terms(text, technical_terms)
    return text


def clean_transcript_segments(
    segments: List[TranscriptSegment],
    filler_words: Set[str] = FILLER_WORDS,
    technical_terms: List[str] = TECHNICAL_TERMS,
) -> List[TranscriptSegment]:
    if not segments:
        raise TranscriptCleaningError("No transcript segments provided.")

    cleaned_segments: List[TranscriptSegment] = []
    for segment in segments:
        text = clean_text(segment.text, filler_words, technical_terms)
        cleaned_segments.append(
            TranscriptSegment(start=segment.start, end=segment.end, text=text)
        )

    return cleaned_segments


def safe_sentence_join(segments: List[TranscriptSegment]) -> str:
    return " ".join(normalize_whitespace(segment.text) for segment in segments if segment.text).strip()


def build_combined_text(document_text: str, cleaned_segments: List[TranscriptSegment]) -> str:
    transcript_text = safe_sentence_join(cleaned_segments)
    if document_text and transcript_text:
        return normalize_whitespace(f"{document_text}\n\n{transcript_text}")
    return normalize_whitespace(document_text or transcript_text)
