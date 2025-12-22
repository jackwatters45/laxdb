import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import { createFileRoute } from '@tanstack/react-router';
import { Schema } from 'effect';
import {
  ArrowLeft,
  Check,
  FileVideo,
  Info,
  Settings,
  Tag,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute(
  '/_protected/$organizationSlug/film/upload'
)({
  component: FilmUploadPage,
});

type UploadedFile = {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  id: string;
  preview?: string;
};

// Form schema - simplified to avoid complex typing issues
const filmMetadataSchema = Schema.Struct({
  title: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Title is required' })
  ),
  gameDate: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Game date is required' })
  ),
  opponent: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Opponent is required' })
  ),
  gameType: Schema.String,
  venue: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  isHomeGame: Schema.Boolean,
  quarter1Start: Schema.optional(Schema.String),
  quarter2Start: Schema.optional(Schema.String),
  quarter3Start: Schema.optional(Schema.String),
  quarter4Start: Schema.optional(Schema.String),
  isPrivate: Schema.Boolean,
});

type FilmMetadataValues = typeof filmMetadataSchema.Type;
type UploadStep = 'upload' | 'metadata' | 'processing';

const gameTypes = [
  'Regular Season',
  'Playoff',
  'Scrimmage',
  'Practice',
] as const;

function FilmUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FilmMetadataValues>({
    resolver: effectTsResolver(filmMetadataSchema),
    defaultValues: {
      title: '',
      gameDate: '',
      opponent: '',
      gameType: 'Regular Season',
      venue: '',
      description: '',
      isHomeGame: true,
      quarter1Start: '',
      quarter2Start: '',
      quarter3Start: '',
      quarter4Start: '',
      isPrivate: false,
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files) {
      return;
    }

    const filesArr = Array.from(files);
    for (const file of filesArr) {
      if (file.type.startsWith('video/')) {
        const newFile: UploadedFile = {
          file,
          progress: 0,
          status: 'uploading',
          id: Math.random().toString(36).substr(2, 9),
        };

        setUploadedFiles((prev) => [...prev, newFile]);
        simulateUpload(newFile.id);
      }
    }
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress: 100, status: 'complete' } : f
          )
        );
      } else {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
        );
      }
    }, 500);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const canProceedToMetadata =
    uploadedFiles.length > 0 &&
    uploadedFiles.every((f) => f.status === 'complete');

  const onSubmit = async (_values: FilmMetadataValues) => {
    setCurrentStep('processing');
    // Simulate processing
    setTimeout(() => {
      // Navigate back to library
    }, 3000);
  };

  if (currentStep === 'processing') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button disabled size="sm" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Button>
          <div>
            <h1 className="font-bold text-3xl">Processing Film</h1>
            <p className="text-muted-foreground">
              Your game film is being processed and will be available shortly
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <FileVideo className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-lg">
                  Processing Your Film
                </h3>
                <p className="mb-4 text-muted-foreground">
                  We're preparing your game film for analysis. This usually
                  takes a few minutes.
                </p>
                <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: '65%' }}
                  />
                </div>
                <p className="text-muted-foreground text-sm">65% complete</p>
              </div>
              <div className="mx-auto max-w-md space-y-2 text-left text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>File uploaded successfully</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Metadata saved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  <span>Generating thumbnail</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  <span>Ready for viewing</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button size="sm" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>
        <div>
          <h1 className="font-bold text-3xl">Upload Game Film</h1>
          <p className="text-muted-foreground">
            Upload and organize your game footage for analysis
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 ${
            currentStep === 'upload'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          <div
            className={`h-2 w-2 rounded-full ${
              currentStep === 'upload' ? 'bg-blue-600' : 'bg-green-600'
            }`}
          />
          Upload Files
        </div>
        <div className="h-px w-8 bg-gray-300" />
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 ${
            currentStep === 'metadata'
              ? 'bg-blue-100 text-blue-800'
              : currentStep === 'upload'
                ? 'bg-gray-100 text-gray-500'
                : 'bg-green-100 text-green-800'
          }`}
        >
          <div
            className={`h-2 w-2 rounded-full ${
              currentStep === 'metadata'
                ? 'bg-blue-600'
                : currentStep === 'upload'
                  ? 'bg-gray-400'
                  : 'bg-green-600'
            }`}
          />
          Add Details
        </div>
        <div className="h-px w-8 bg-gray-300" />
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 ${
            (currentStep as UploadStep) === 'processing'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          <div
            className={`h-2 w-2 rounded-full ${
              (currentStep as UploadStep) === 'processing'
                ? 'bg-blue-600'
                : 'bg-gray-400'
            }`}
          />
          Processing
        </div>
      </div>

      {currentStep === 'upload' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Video Files</CardTitle>
              <CardDescription>
                Select or drag & drop video files to upload. Supported formats:
                MP4, MOV, AVI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button
                className={`w-full rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                type="button"
              >
                <input
                  accept="video/*"
                  className="hidden"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  ref={fileInputRef}
                  type="file"
                />

                <div className="space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-lg">
                      {isDragging ? 'Drop files here' : 'Upload video files'}
                    </h3>
                    <p className="mb-4 text-muted-foreground">
                      Drag and drop your video files here, or click to browse
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Files
                    </Button>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Maximum file size: 5GB per file
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>

          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Files</CardTitle>
                <CardDescription>
                  {uploadedFiles.length} file(s) selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div
                    className="flex items-center gap-4 rounded-lg border p-3"
                    key={file.id}
                  >
                    <div className="flex-shrink-0">
                      <FileVideo className="h-8 w-8 text-blue-500" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="truncate font-medium text-sm">
                          {file.file.name}
                        </p>
                        <Badge
                          className="text-xs"
                          variant={
                            file.status === 'complete'
                              ? 'default'
                              : file.status === 'error'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {file.status === 'uploading' && 'Uploading'}
                          {file.status === 'processing' && 'Processing'}
                          {file.status === 'complete' && 'Complete'}
                          {file.status === 'error' && 'Error'}
                        </Badge>
                      </div>

                      <div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs">
                        <span>{formatFileSize(file.file.size)}</span>
                        <span>•</span>
                        <span>{file.file.type}</span>
                      </div>

                      {file.status !== 'complete' && (
                        <div className="h-1.5 w-full rounded-full bg-gray-200">
                          <div
                            className="h-1.5 rounded-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeFile(file.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              disabled={!canProceedToMetadata}
              onClick={() => setCurrentStep('metadata')}
            >
              Continue to Details
            </Button>
          </div>
        </div>
      )}

      {currentStep === 'metadata' && (
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Game Information</CardTitle>
                <CardDescription>
                  Add details about this game to help organize your film library
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., vs Eagles - Championship Game"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gameDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="opponent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opponent</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Central Eagles"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gameType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game Type</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select game type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gameTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Home Field" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isHomeGame"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home/Away</FormLabel>
                        <Select
                          defaultValue={field.value ? 'true' : 'false'}
                          onValueChange={(value) =>
                            field.onChange(value === 'true')
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Home Game</SelectItem>
                            <SelectItem value="false">Away Game</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes about this game..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Tags</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add tags..."
                      value={currentTag}
                    />
                    <Button
                      disabled={!currentTag.trim()}
                      onClick={addTag}
                      type="button"
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          className="text-xs"
                          key={tag}
                          variant="secondary"
                        >
                          {tag}
                          <button
                            className="ml-1 hover:text-destructive"
                            onClick={() => removeTag(tag)}
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          checked={field.value}
                          className="rounded"
                          onChange={field.onChange}
                          type="checkbox"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Make this film private (only visible to coaching
                          staff)
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>
                  Optional: Set quarter start times for easier navigation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quarter1Start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>1st Quarter Start</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quarter2Start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>2nd Quarter Start</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quarter3Start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>3rd Quarter Start</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quarter4Start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>4th Quarter Start</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex gap-2">
                    <Info className="mt-0.5 h-4 w-4 text-blue-600" />
                    <div className="text-blue-800 text-sm">
                      <p className="mb-1 font-medium">
                        Quarter timestamps help with navigation
                      </p>
                      <p>
                        When viewing the film, users can quickly jump to
                        specific quarters. Leave blank if not applicable.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                onClick={() => setCurrentStep('upload')}
                type="button"
                variant="outline"
              >
                Back to Upload
              </Button>
              <Button disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? 'Uploading...' : 'Upload Film'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
