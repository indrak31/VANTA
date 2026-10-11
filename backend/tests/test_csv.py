import pytest

from app.csv_utils import CSVValidationError, parse_feedback_csv, safe_csv_cell


def test_csv_parser_rejects_formula_injection():
    with pytest.raises(CSVValidationError, match="formula-like"):
        parse_feedback_csv(b"text,rating\n=HYPERLINK(\"http://evil\"),2\n")


def test_csv_parser_accepts_utf8_and_reports_bad_rows_deterministically():
    parsed = parse_feedback_csv("text,rating,category\nGreat café,5,product\n,2,product\n".encode("utf-8"))
    assert len(parsed.rows) == 1
    assert parsed.rows[0]["text"] == "Great café"
    assert parsed.errors == ["row 3: text is required"]


def test_export_cell_is_neutralized():
    assert safe_csv_cell("=SUM(A1:A2)") == "'=SUM(A1:A2)"
    assert safe_csv_cell("-12") == "-12"
