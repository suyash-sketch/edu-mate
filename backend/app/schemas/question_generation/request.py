from pydantic import BaseModel, Field, model_validator


class BloomCounts(BaseModel):
    remember: int = Field(default=0, ge=0)
    understand: int = Field(default=0, ge=0)
    apply: int = Field(default=0, ge=0)
    analyze: int = Field(default=0, ge=0)
    evaluate: int = Field(default=0, ge=0)
    create: int = Field(default=0, ge=0)

    @property
    def total(self) -> int:
        return (
            self.remember
            + self.understand
            + self.apply
            + self.analyze
            + self.evaluate
            + self.create
        )

    def as_dict(self) -> dict[str, int]:
        return {
            "remember": self.remember,
            "understand": self.understand,
            "apply": self.apply,
            "analyze": self.analyze,
            "evaluate": self.evaluate,
            "create": self.create,
        }


class GenerationRequest(BaseModel):
    query: str = Field(min_length=1)
    collection_name: str = Field(min_length=1)

    mcq_count: int = Field(default=0, ge=0)
    subjective_count: int = Field(default=0, ge=0)

    blooms: BloomCounts

    @property
    def total_questions(self) -> int:
        return self.mcq_count + self.subjective_count

    @model_validator(mode="after")
    def validate_question_counts(self):
        if self.total_questions == 0:
            raise ValueError(
                "Choose at least one MCQ or subjective question."
            )

        if self.blooms.total != self.total_questions:
            raise ValueError(
                "The total MCQ and subjective question count must match "
                "the total Bloom's taxonomy count."
            )

        return self