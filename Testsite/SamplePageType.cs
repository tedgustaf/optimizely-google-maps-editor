using EPiServer.Cms.Shell.UI.ObjectEditing.EditorDescriptors;
using EPiServer.Core;
using EPiServer.DataAnnotations;
using EPiServer.Shell.ObjectEditing;
using GoogleMapsEditor;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Testsite;

[ContentType(GUID = "f868e34f-f20d-4a41-b8b5-94694f603110")]
public class SamplePageType : PageData
{
    [UIHint(GoogleMapsEditorDescriptor.UIHint)]
    public virtual string? StringCoordinates { get; set; }

    public virtual GoogleMapsCoordinates? BlockCoordinates { get; set; }

    [Display(GroupName = "Different tab")]
    [UIHint(GoogleMapsEditorDescriptor.UIHint)]
    public virtual string? MoreStringCoordinates { get; set; }

    public virtual SampleBlockType? SampleBlock { get; set; }

    public virtual ContentArea? ContentArea { get; set; }

    public virtual IList<SampleBlockType>? SampleBlockList { get; set; }

    [EditorDescriptor(EditorDescriptorType = typeof(CollectionEditorDescriptor<ListItem>))]
    public virtual IList<ListItem>? ListItems { get; set; }
}
