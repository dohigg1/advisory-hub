interface Props {
  allowRetakes: boolean;
  brandColour: string;
  onRetake: () => void;
}

export function AlreadyCompleted({ allowRetakes, brandColour, onRetake }: Props) {
  return (
    <div className="text-center max-w-md">
      <h2 className="text-2xl font-bold mb-3">Already Completed</h2>
      <p className="text-muted-foreground mb-6">
        You have already completed this assessment.
      </p>
      {allowRetakes && (
        <button
          onClick={onRetake}
          className="h-10 px-6 rounded-md text-white text-sm font-medium"
          style={{ backgroundColor: brandColour }}
        >
          Retake Assessment
        </button>
      )}
    </div>
  );
}
