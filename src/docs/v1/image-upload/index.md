## Introduction

This chapter addresses methods by which we optimize images coming into our application, and test our application's image upload channels before setting out to publish the software for public consumption. Because optimizing images is easy to overlook, Suphle bakes mechanisms for automatically doing this behind the scenes, before you can read their paths for writing to disk, or inserting their names into the database.

## Intercepting image files

Converting uploaded images in Suphle is [conceptually consistent](/docs/v1/service-coordinators#Model-based-request-type) with `ModellessPayload` in that there's an overarching reader used to extract relevant input entries. In the case of images, recommended reader is `Suphle\Services\Structures\ImagefulPayload`. However, instead of returning a database builder, it's expected to return an image optimization builder.

A complete image upload collaboration will look similar to that below.

```php

class ImagePayloadReader extends ImagefulPayload {

	protected function convertToDomainObject () {

		return $this->imageOptimizer->setImages(

			$this->allFiles,

			$this->payloadStorage->getKey("belonging_resource")
		);
	}
}

class ImageUploadCoordinator extends ServiceCoordinator {

	#[ValidationRules([
		"belonging_resource" => "required|string",

		"profile_pic" => "required|image"
	])]
	public function applyThumbnail (ImagePayloadReader $payload):array {

		return $payload->getDomainObject()->thumbnail(50, 50)

		->savedImageNames();
	}
}
```

### Initializing the image optimizer

`ImagefulPayload` injects Suphle's default optimizer, `
Suphle\IO\Image\OptimizersManager`, setting that to its `imageOptimizer` property. The optimizer is initialized with its `setImages` method, which takes 2 arguments: The list of files to optimize and upload, and their collective resource name. A resource name should be treated as the category or image domain e.g. "profile_pictures", "site_banners", "product_images", etc. In the example above, resource name is being read from payload, under the assumption that this is a generic reader uploading images for dynamic domains.

In the first argument to `setImages` above, we use the property `ImagefulPayload::allFiles` to transfer the entire array of images received to the optimizer. Behind the scenes, files residing on this property have been converted from native `$_FILES` to `Symfony\Component\HttpFoundation\File\UploadedFile` objects. To exclude certain files or transform the list into a single dimensional array expected by the optimizer, these objects would have to filtered or normalized as dictated by incoming payload.

`ImagefulPayload` only allows for uploading one resource collection at a time. Single endpoints either simultaneously handling multiple resources or optional images should consider using conditionals or splitting the reader into as many `ImagefulPayload`s as necessary.

### Applying optimizer operations

Once appropriate image fields are selected, the objective is to write them to disk, and persist the stored names into some database. However, `OptimizersManager` will throw an `Suphle\Exception\Explosives\Generic\UnmodifiedImageException` exception on attempts to save a resource collection without first applying optimizations to it. At the very least, images are expected to all conform to a uniform size.

The default optimizer doesn't seek to encompass all possible operations, only those considered essential:

#### Automatically getting image thumbnails

The `thumbnail` method takes dimensions for expected width and height, respectively.

```php

public function applyThumbnail (ImagePayloadReader $payload):array {

	return $payload->getDomainObject()->thumbnail(50, 50)

	->savedImageNames();
}
```

#### Downsizing image

Often, developers recklessly permit upload of images beyond reasonable file size, ending up bloating storage space and resulting in slow responses. We use the `inferior` method to curtail image size to an acceptable maximum, in kilobytes.

```php

public function applyInferior (ImagePayloadReader $payload):array {

	return $payload->getDomainObject()->inferior(150)

	->savedImageNames();
}
```

The optimizer is built such that multiple operations can be applied to it at the same time.

```php

public function applyAllOptimizations (ImagePayloadReader $payload):array {

	$fileNames = $payload->getDomainObject()

	->inferior(150)->thumbnail(50, 50)->savedImageNames();

	return $fileNames; // or forward it to a service for persistence into the database
}
```

`savedImageNames` returns the names of each stored image, grouped by operation name applied. When using local file storage, directory used to store this collection would correspond to a concatenation of configured image storage path, given resource name, and generated name. For example, suppose the collection was only downsized, returned array would look like:

```php

[
	"inferior" => [

		"module_image_path/inferior/profile_pictures/img1.png" // ... for as many images as were saved)
	]
];
```

Module image paths are configured using the file config method, `Suphle\Contracts\Config\ModuleFiles::getImagePath`. Its value defaults to "Images".

Generated file name for the image is determined by the name resolver method, `Suphle\Contracts\IO\Image\ImageLocator::resolveName`. Default implementation of this method combine session ID and PHP's `time` function to ensure a consistently unique string for each image.

## Customizing the optimizer

This section goes into detail about what powers the optimizer under the hood. If you have no interest in replacing underlying clients or supplementing the optimizer with your own operations, you can skip to the next section.

### Adding other operations

To add a new operation, the following steps must be taken.

#### Extending the optimizer

The first step in modifying the optimizer is by extending the base, `
Suphle\IO\Image\OptimizersManager`. The base optimizer unifies working with synchronous and asynchronous operations, and cleans up temporary files for you. Suppose we want to include a watermark operation, we'd plant its method on the sub optimizer, and provide a client for it to work with as shown below:

```php

class CustomOptimizersManager extends OptimizersManager {

	protected $watermarkOperation;

	public function dependencyMethods ():array {

		return array_merge(parent::dependencyMethods(), [

			"setWatermarkHandler"
		]);
	}

	public function setWatermarkHandler (WatermarkHandler $watermarkOperation):void {

		$this->watermarkOperation = $watermarkOperation;
	}

	public function watermark (string $textToFade, int $fadePercent):self {

		$this->watermarkOperation->setFade($textToFade, $fadePercent);

		$this->operations[] = $this->watermarkOperation;

		return $this;
	}
}
```

If this optimizer is injected into our payload reader, our watermark operation can then be consumed in the coordinator in the same manner as the defaults:

```php

public function applyWatermark (ImagePayloadReader $payload):array {

	return $payload->getDomainObject()->watermark("site_name.com", 70)

	->savedImageNames();
}
```

We are able to type-hint any client necessary for the operation, since `OptimizersManager` is [decorated with](/docs/v1/service-coordinators#Variadic-setters) `Suphle\Contracts\Services\Decorators\VariableDependencies`.

#### Writing an operation

Image optimization operations are divided into 2 parts:

- The operation itself, which serves as the optimizer's API to the underlying client.
- The client. This is the library doing the heavy lifting behind the scenes, as you are unlikely to develop image optimization functionality by hand.

Operation classes are expected to implement the `Suphle\Contracts\IO\Images\ImageOptimiseOperation` interface. It has the following signature:

```php

interface ImageOptimiseOperation {

	public function getTransformed ():?array;

	/**
	 * @param {images} UploadedFile[]
	*/
	public function setFiles (array $images):void;

	public function setResourceName (string $name):void;

	/**
	 * @return Name of sub-folder where image will be stored e.g. images/{operationName}/{resourceName}
	*/
	public function getOperationName ():string;

	public function savesAsync ():bool;

	public function getAsyncNames ():array;
}
```

Majority of these methods are boilerplate implemented on `Suphle\IO\Image\Operations\BaseOptimizeOperation`. By extending it, you are only required to interact with the underlying client inside your operation's `getTransformed` method.

```php

use Suphle\File\FileSystemReader;

use Suphle\Contracts\IO\Image\ImageLocator;

use SomeLib\WatermarkClient;

class WatermarkHandler extends BaseOptimizeOperation {

	public const OPERATION_NAME = "watermarked";

	protected string $textToFade;

	protected int $fadePercent;

	public function __construct (
		protected readonly WatermarkClient $client,

		ImageLocator $imageLocator, FileSystemReader $fileSystemReader
	) {

		parent::__construct($imageLocator, $fileSystemReader);
	}

	public function setFade(string $textToFade, int $fadePercent):void {

		$this->textToFade = $textToFade;

		$this->fadePercent = $fadePercent;
	}

	public function getTransformed ():?array {

		return array_map(function ($file) {

			$newPath = $this->localFileCopy($file);

			return $this->client->attachWatermark(
				
				$newPath, $this->textToFade, $this->fadePercent
			);
		}, $this->imageObjects);
	}
}
```

The operation above makes use of a non-existent client, so don't spend too much time on its API. The part to pay attention to is the call to `localFileCopy`. This is a helper method on `BaseOptimizeOperation` enabling operations transform only their copy of the files, as opposed to moving the original file, thereby affecting subsequent operations. After creating new files for this operation, `getTransformed` is expected to return the list of file names for insertion into a persistent storage

##### Asynchronous operations

The `localFileCopy` method mentioned above has but one caveat: it's mainly suited for operations performed against the same file system application is running on. The disadvantages to this can be enumerated as:

- Where applicable, blocking operations should be deferred to be performed after responding.

- Developers sometimes prefer other storage platforms for managing their media content, for example CDNs. In some cases, these platforms enable their users edit images on the fly.

In any case, these are commendable practices that Suphle won't fight if you choose to follow. What you'd have to do is mark the operation as asynchronous and generate file names that would both be fed to your third-party platform and be used to complete user request. After this, the optimizer would queue the operation for you. Adjusting our `WatermarkHandler` to become asynchronous would look like this:

```php

class WatermarkHandler extends BaseOptimizeOperation {

	protected $generatedFileNames = [];

	public function savesAsync ():bool {

		return true;
	}

	public function getAsyncNames ():array {

		return $this->generatedFileNames = array_map(function ($image) {

			return $this->getImageNewName($image);
		}, $this->imageObjects);
	}

	public function getTransformed ():?array {

		$this->client->setImagePaths($this->generatedFileNames)

		->attachWatermark($this->textToFade, $this->fadePercent);
	}
}
```

To delegate image name generation to some other class, you can either replace the `BaseOptimizeOperation::getImageNewName` if your logic is a trivial one, or provide an alternate implementation of the `Suphle\Contracts\IO\Image\ImageLocator` interface, otherwise.

In any case, name generation must be synchronous. Endeavor to return a fully qualified path to the image to be saved i.e. "module_image_path/operation_name/resource_name/generated.extension".

### Replacing client adapters

In order to do peripheral things (i.e. without visible difference to the consumer) such replacing existing operations with their asynchronous alternatives, we have to look a bit into the nitty-gritty of the optimizer manager. Replacing its default operations and their underlying clients is a matter of substituting their interfaces. Each operation is powered by a local filesystem client. The following heirarchy exists for the collaborators:

- `Suphle\Contracts\IO\Image\ThumbnailOperationHandler`: `Suphle\IO\Image\Operations\DefaultThumbnailHandler`

- `Suphle\Contracts\IO\Image\ImageThumbnailClient`: `Suphle\Adapters\Image\Optimizers\ImagineClient`

- `Suphle\Contracts\IO\Image\InferiorOperationHandler`: `Suphle\IO\Image\Operations\DefaultInferiorHandler`

- `Suphle\Contracts\IO\Image\InferiorImageClient`: `Suphle\Adapters\Image\Optimizers\NativeReducerClient`

## Testing file handling

This section encompasses a holistic view of work with files, beyond mere images, although we do touch on the subject. These sort of tests assume verifications are being made against the local filesystem. Dummy files will be created and wiped on it where necessary.

Tests interacting with the filesystem are required to use the trait `Suphle\Testing\Condiments\FilesystemCleaner`, as it not only houses assertion methods but helpers to create dummy files for application to work with in test environment.

### File testing helpers

#### Uploading test images

File upload helpers are only potent within HTTP tests. In addition to headers and request payloads, it defines an argument with which a file can be created on the fly to match certain specifications. Suppose, we have an image-handling endpoint and wish to simulate reception of an image beyond dimensions suitable for the project, we'd test it as follows:

```php

public function test_image_upload () {

	$this->postJson("/api/v1/segment", [ // when

			"belonging_resource" => "profile_pic"

		], [], [

			"profile_pic" => $this->saveFakeImage("portait.png", 450, 200, 300) // given
		]
	);

	// then // some assertion
}
```

The `saveFakeImage` method takes the name of the image to create, its dimensions, its size in kilobytes, and returns an instance of `Symfony\Component\HttpFoundation\File\UploadedFile`. If you're not using one of the assertions that automatically wipe the images for you, you'd have to clean up after yourself.

#### Uploading test files

All other file types fall within this category. The `saveFakeFile` method takes file name, its format, and returns a sub-class of `UploadedFile`:

```php

public function test_file_upload () {

	$this->postJson("/api/v1/segment", [], [], [

			"submission" => $this->saveFakeFile("sepulchre.pdf", 500) // given
		]
	); // when

	// then // some assertion
}
```

Unlike the `saveFakeImage` method discussed above, `saveFakeFile` doesn't actually write the file to disk, as that would require an infinite amount of file creators.

### File testing assertions

#### assertEmptyDirectory

This assertion and its inverse, `assertNotEmptyDirectory`, are used as sanity-checks before or after inciting an action expected to create files under test.

```php

public function test_disgraceful_shutdown_successful () {

	$this->assertEmptyDirectory($somePath); // given

	// when // some action

	$this->assertNotEmptyDirectory($somePath); // then
}
```

`assertNotEmptyDirectory` takes an optional 2nd argument that cleans up given directory if the assertion passes.

```php

	$this->assertNotEmptyDirectory($somePath, true); // then
```

#### assertSavedFiles

This assertion and its complementary, `assertSavedFileNames`, are simply used for affirming files exist, usually after performing a creation action. It's a high-lvel wrapper around the native `assertFileExists` that can accept a deeply nested structure of files, and will extract them according to the given indexes. Indexes would typically correspond to those alleged to have been saved by a coordinator and its optimizer manager.

Since image name generation is delegated to other collaborators, testers can either mock out optimizer manager, or even better, make verifications using a wildcard format. In practise, that would look like:

```php

class ProductImageService extends UpdatelessService {

	public function __construct (protected readonly ImagePayloadReader $reader) {

		//
	}

	public function saveColorSlides ():array {

		return $this->reader->inferior(50)->thumbnail(20, 20)

		->savedImageNames();
	}
}

class ProductImageTest extends IsolatedComponentTest {

	use FilesystemCleaner;

	public function test_will_save_multiple_operations () {

		// given // bind a loaded file input reader to the container

		$imageNames = $this->getContainer(ProductImageService::class)

		->saveColorSlides(); // when

		// then
		foreach ([

			InferiorOperationHandler::OPERATION_NAME,

			ThumbnailOperationHandler::OPERATION_NAME
		] as $operation)

			$this->assertArrayHasKey($operation, $imageNames); // sanity check for below assertion

		$this->assertSavedFiles(["*.*"], $imageNames);
	}
}
```

For both methods, files at given locations are deleted for you after the method verifies its presence.

The API for `assertSavedFileNames` is slightly different: It doesn't accept wildcards but an array of literal filenames:

```php

public function test_modified_module_path () {

	$somePath = $this->fileSystemReader->getImagePath(); // given

	// when => Do something with $somePath

	$this->assertSavedFileNames([$somePath]); // then
}
```

#### assertContainsEntries

This assertion and its inverse, `assertLacksEntries`, are used to verify presence of specific files at a given path.

```php

public function test_library_wrote_files () {

	// when => some operation

	$this->assertContainsEntries ($somePath, [

		"relative", "file", "name"
	]); // then
}
```

They differ from `assertSavedFiles` in that file names it receives are premeditated from developer's end i.e. not necessarily user-facing image upload.